import fs from 'node:fs'
import path from 'node:path'

import type { ActionFunction, ActionParams } from '@sdk/types'
import { leon } from '@sdk/leon'
import { ParamsHelper } from '@sdk/params-helper'
import { Settings } from '@sdk/settings'
import FasterWhisperTool from '@sdk/tools/faster_whisper-tool'
import OpenAIAudioTool from '@sdk/tools/openai_audio-tool'
import { formatFilePath } from '@sdk/utils'

interface MusicAudioToolkitSkillSettings extends Record<string, unknown> {
  transcriber_provider: 'faster_whisper' | 'openai_audio'
  device?: 'auto' | 'cpu' | 'cuda'
  cpu_threads?: number
  openai_api_key?: string
  openai_model?: string
}

export const run: ActionFunction = async function (
  _params: ActionParams,
  paramsHelper: ParamsHelper
) {
  const audioPathArg =
    paramsHelper.getActionArgument('audio_path') ||
    (paramsHelper.findActionArgumentFromContext('audio_path') as string)

  try {
    const settings = new Settings<MusicAudioToolkitSkillSettings>()
    const provider = ((await settings.get('transcriber_provider')) ||
      'faster_whisper') as MusicAudioToolkitSkillSettings['transcriber_provider']
    const fasterWhisperDevice = ((await settings.get(
      'faster_whisper_device'
    )) || 'auto') as NonNullable<MusicAudioToolkitSkillSettings['device']>
    const fasterWhisperCPUThreads = (await settings.get(
      'faster_whisper_cpu_threads'
    )) as number | undefined
    const openaiApiKey = (await settings.get('openai_api_key')) as
      | string
      | undefined
    const openaiModel = ((await settings.get('openai_model')) ||
      'whisper-1') as string

    const audioPath = audioPathArg || paramsHelper.getContextData('audio_path')

    if (!audioPath || !fs.existsSync(audioPath)) {
      leon.answer({
        key: 'audio_not_found'
      })
      return
    }

    const audioDir = path.dirname(audioPath)
    const audioName = path.parse(audioPath).name
    const transcriptionPath = path.join(
      audioDir,
      `${audioName}_transcription.txt`
    )

    leon.answer({
      key: 'transcription_started',
      data: {
        audio_path: formatFilePath(audioPath),
        provider
      }
    })

    if (provider === 'faster_whisper') {
      const tool = new FasterWhisperTool()
      await tool.transcribeToFile(
        audioPath,
        transcriptionPath,
        fasterWhisperDevice,
        fasterWhisperCPUThreads
      )
    } else if (provider === 'openai_audio') {
      if (!openaiApiKey) {
        leon.answer({ key: 'missing_api_key' })
        return
      }

      const tool = new OpenAIAudioTool()
      await tool.transcribeToFile(
        audioPath,
        transcriptionPath,
        openaiApiKey,
        openaiModel
      )
    } else {
      leon.answer({ key: 'provider_not_supported' })
      return
    }

    if (!fs.existsSync(transcriptionPath)) {
      leon.answer({
        key: 'transcription_error',
        data: { error: 'Transcription file not found' }
      })
      return
    }

    leon.answer({
      key: 'transcription_completed',
      data: {
        transcription_path: formatFilePath(transcriptionPath)
      },
      core: {
        context_data: {
          transcription_path: transcriptionPath
        }
      }
    })
  } catch (error) {
    leon.answer({
      key: 'transcription_error',
      data: { error: (error as Error).message }
    })
  }
}
