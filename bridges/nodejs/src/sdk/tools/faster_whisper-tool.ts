import { Tool } from '@sdk/base-tool'
import { ToolkitConfig } from '@sdk/toolkit-config'

const MODEL_NAME = 'faster-whisper-large-v3'

export default class FasterWhisperTool extends Tool {
  private static readonly TOOLKIT = 'music_audio'
  private readonly config: ReturnType<typeof ToolkitConfig.load>

  constructor() {
    super()
    // Load configuration from central toolkits directory
    // Use class name for tool config name
    const toolConfigName = 'faster_whisper'
    this.config = ToolkitConfig.load(FasterWhisperTool.TOOLKIT, toolConfigName)
  }

  get toolName(): string {
    // Dynamic tool name based on class name
    return this.constructor.name
  }

  get toolkit(): string {
    return FasterWhisperTool.TOOLKIT
  }

  get description(): string {
    return this.config['description']
  }

  /**
   * Transcribe audio to a file using faster-whisper
   * @param inputPath The file path of the audio to be transcribed
   * @param outputPath The desired file path for the transcription output
   * @param modelSizeOrPath Optional model size or path (default: auto-downloaded large-v3)
   * @param device Device to use for processing (cpu, cuda, auto)
   * @param cpuThreads Number of CPU threads to use
   * @param downloadRoot Root directory for model downloads
   * @param localFilesOnly Whether to use only local files
   * @returns A promise that resolves with the path to the transcription file
   */
  async transcribeToFile(
    inputPath: string,
    outputPath: string,
    modelSizeOrPath?: string,
    device = 'auto',
    cpuThreads?: number,
    downloadRoot?: string,
    localFilesOnly = false
  ): Promise<string> {
    try {
      // Get model path using the generic resource system
      const modelPath =
        modelSizeOrPath || (await this.getResourcePath(MODEL_NAME))

      const args = [
        '--function',
        'transcribe_to_file',
        '--input',
        inputPath,
        '--output',
        outputPath,
        '--model_size_or_path',
        modelPath,
        '--device',
        device
      ]

      if (cpuThreads) {
        args.push('--cpu_threads', cpuThreads.toString())
      }

      if (downloadRoot) {
        args.push('--download_root', downloadRoot)
      }

      if (localFilesOnly) {
        args.push('--local_files_only')
      }

      await this.executeCommand({
        binaryName: 'faster_whisper',
        args,
        options: { sync: true }
      })

      return outputPath
    } catch (error: unknown) {
      throw new Error(`Audio transcription failed: ${(error as Error).message}`)
    }
  }
}
