import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { getPlatformName } from '@sdk/utils'

interface ToolConfig {
  description: string
  binaries?: Record<string, string>
  resources?: Record<string, string[]>
}

interface ToolkitConfigData {
  name: string
  description: string
  tools: Record<string, ToolConfig>
}

export class ToolkitConfig {
  private static configCache = new Map<string, ToolkitConfigData>()
  private static settingsCache = new Map<string, Record<string, unknown>>()

  /**
   * Load tool configuration from bridges/toolkits directory
   * @param toolkitName - The toolkit name (e.g., 'video_streaming')
   * @param toolName - Name of the tool (e.g., 'ffmpeg')
   */
  static load(toolkitName: string, toolName: string): ToolConfig {
    const cacheKey = toolkitName

    // Load toolkit config if not cached
    if (!this.configCache.has(cacheKey)) {
      const configPath = join(
        process.cwd(),
        'bridges',
        'toolkits',
        toolkitName,
        'toolkit.json'
      )
      const configContent = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(configContent) as ToolkitConfigData

      this.configCache.set(cacheKey, config)
    }

    const toolkitConfig = this.configCache.get(cacheKey)!
    const toolConfig = toolkitConfig.tools[toolName]

    if (!toolConfig) {
      throw new Error(
        `Tool '${toolName}' not found in toolkit '${toolkitConfig.name}'`
      )
    }

    return toolConfig
  }

  /**
   * Load toolkit settings from bridges/toolkits directory
   * @param toolkitName - The toolkit name (e.g., 'video_streaming')
   */
  static loadSettings(toolkitName: string): Record<string, unknown> {
    const cacheKey = toolkitName

    if (!this.settingsCache.has(cacheKey)) {
      const settingsPath = join(
        process.cwd(),
        'bridges',
        'toolkits',
        toolkitName,
        'settings.json'
      )

      let settingsConfig: Record<string, unknown> = {}
      if (existsSync(settingsPath)) {
        const settingsContent = readFileSync(settingsPath, 'utf-8')
        settingsConfig = JSON.parse(settingsContent) as Record<string, unknown>
      }

      this.settingsCache.set(cacheKey, settingsConfig)
    }

    return this.settingsCache.get(cacheKey) || {}
  }

  /**
   * Load tool-specific settings from toolkit settings file
   * @param toolkitName - The toolkit name (e.g., 'video_streaming')
   * @param toolName - Name of the tool (e.g., 'ffmpeg')
   */
  static loadToolSettings(
    toolkitName: string,
    toolName: string
  ): Record<string, unknown> {
    const settings = this.loadSettings(toolkitName)
    const toolSettings = settings[toolName] as Record<string, unknown>

    return toolSettings && typeof toolSettings === 'object' ? toolSettings : {}
  }

  /**
   * Get binary download URL for current platform with architecture granularity
   */
  static getBinaryUrl(config: ToolConfig): string | undefined {
    const platformName = getPlatformName()

    return config.binaries?.[platformName]
  }
}
