import os from 'node:os'

/**
 * Formats a file path as a clickable path with proper delimiters
 * @param filePath The absolute file path to format
 * @returns A formatted string that the client can detect and make clickable
 * @example formatFilePath('/Users/john/video.mp4') // returns '[FILE_PATH]/Users/john/video.mp4[/FILE_PATH]'
 */
export function formatFilePath(filePath: string): string {
  return `[FILE_PATH]${filePath}[/FILE_PATH]`
}

/**
 * Formats multiple file paths as a list of clickable paths
 * @param filePaths Array of absolute file paths
 * @returns A formatted string with multiple clickable paths
 * @example formatFilePaths(['/path1', '/path2']) // returns '[FILE_PATH]/path1[/FILE_PATH], [FILE_PATH]/path2[/FILE_PATH]'
 */
export function formatFilePaths(filePaths: string[]): string {
  return filePaths.map(formatFilePath).join(', ')
}

/**
 * Platform utilities for consistent platform and architecture detection
 * Matches the naming convention from system-helper.ts BinaryFolderNames enum
 */

/**
 * Get platform name with architecture granularity (matches system-helper.ts)
 * Returns same format as BinaryFolderNames enum from system-helper.ts
 */
export function getPlatformName(): string {
  const platform = os.platform()
  const cpuArchitecture = os.arch()

  if (platform === 'linux') {
    if (cpuArchitecture === 'x64') {
      return 'linux-x86_64'
    }

    return 'linux-aarch64'
  }

  if (platform === 'darwin') {
    const cpuCores = os.cpus()
    const isM1 = cpuCores[0]?.model.includes('Apple')

    if (isM1 || cpuArchitecture === 'arm64') {
      return 'macosx-arm64'
    }

    return 'macosx-x86_64'
  }

  if (platform === 'win32') {
    return 'win-amd64'
  }

  return 'unknown'
}

/**
 * Check if current platform is Windows
 * @returns True if running on Windows, false otherwise
 * @example if (isWindows()) { executableName += '.exe' }
 */
export function isWindows(): boolean {
  return getPlatformName().startsWith('win')
}

/**
 * Check if current platform is macOS
 * @returns True if running on macOS, false otherwise
 * @example if (isMacOS()) { await removeQuarantineAttribute(binaryPath) }
 */
export function isMacOS(): boolean {
  return getPlatformName().startsWith('macosx')
}

/**
 * Check if current platform is Linux
 * @returns True if running on Linux, false otherwise
 * @example if (isLinux()) { await checkSystemPackage('ffmpeg') }
 */
export function isLinux(): boolean {
  return getPlatformName().startsWith('linux')
}
