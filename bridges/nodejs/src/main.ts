import path from 'node:path'

import { SkillBridges } from '@/core/brain/types'
import { FileHelper } from '@/helpers/file-helper'

import type { ActionFunction, ActionParams } from '@sdk/types'
import { INTENT_OBJECT } from '@bridge/constants'
;(async (): Promise<void> => {
  const {
    lang,
    utterance,
    action_arguments: actionArguments,
    entities,
    sentiment,
    context_name: contextName,
    skill_name: skillName,
    action_name: actionName,
    context,
    skill_config: skillConfig,
    skill_config_path: skillConfigPath,
    extra_context: extraContext
  } = INTENT_OBJECT

  const params: ActionParams = {
    lang,
    utterance,
    actionArguments,
    entities,
    sentiment,
    contextName,
    skillName,
    actionName,
    context: {
      ...context,
      actionArguments: context.action_arguments
    },
    skillConfig: {
      ...skillConfig,
      bridge: skillConfig.bridge as SkillBridges,
      flow: skillConfig.flow ?? []
    },
    skillConfigPath,
    extraContext
  }

  try {
    const actionModule = await FileHelper.dynamicImportFromFile(
      path.join(
        process.cwd(),
        'skills',
        skillName,
        'src',
        'actions',
        `${actionName}.ts`
      )
    )
    const actionFunction: ActionFunction = actionModule.run

    await actionFunction(params)
  } catch (e) {
    console.error(
      `Error while running "${skillName}" skill "${actionName}" action:`,
      e
    )
  }
})()
