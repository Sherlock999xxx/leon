import { platform, arch, cpus } from 'node:os'

import axios from 'axios'

const HUGGING_FACE_URL = 'https://huggingface.co'
const HUGGING_FACE_MIRROR_URL = 'https://hf-mirror.com'

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
  const platformName = platform()
  const cpuArchitecture = arch()

  if (platformName === 'linux') {
    if (cpuArchitecture === 'x64') {
      return 'linux-x86_64'
    }

    return 'linux-aarch64'
  }

  if (platformName === 'darwin') {
    const cpuCores = cpus()
    const isM1 = cpuCores[0]?.model.includes('Apple')

    if (isM1 || cpuArchitecture === 'arm64') {
      return 'macosx-arm64'
    }

    return 'macosx-x86_64'
  }

  if (platformName === 'win32') {
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

/**
 * Check if the current network can access Hugging Face
 * @example canAccessHuggingFace() // true
 */
export async function canAccessHuggingFace(): Promise<boolean> {
  try {
    await axios.head(HUGGING_FACE_URL, { timeout: 5000 })
    return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false
  }
}

/**
 * Set the Hugging Face URL based on the network access
 * @param url The URL to set
 * @example setHuggingFaceURL('https://huggingface.co') // https://hf-mirror.com
 */
export async function setHuggingFaceURL(url: string): Promise<string> {
  if (!url.includes('huggingface.co')) {
    return url
  }

  const canAccess = await canAccessHuggingFace()

  if (!canAccess) {
    return url.replace(HUGGING_FACE_URL, HUGGING_FACE_MIRROR_URL)
  }

  return url
}
