import fs from 'node:fs'
import path from 'node:path'
import { spawn, execSync } from 'node:child_process'

import axios from 'axios'

import { TOOLKITS_PATH } from '@bridge/constants'
import { ToolkitConfig } from '@sdk/toolkit-config'
import { isWindows, isMacOS } from '@sdk/utils'
import { leon } from '@sdk/leon'

// Progress callback type for reporting tool progress
export type ProgressCallback = (progress: {
  percentage?: number
  status?: string
  eta?: string
  speed?: string
  size?: string
}) => void

// Command execution options
export interface ExecuteCommandOptions {
  binaryName: string
  args: string[]
  options?: {
    cwd?: string
    timeout?: number
    encoding?: BufferEncoding
    sync?: boolean
  }
  onProgress?: ProgressCallback
  onOutput?: (data: string, isError?: boolean) => void
}

export abstract class Tool {
  /**
   * Tool name
   */
  abstract get toolName(): string

  /**
   * Toolkit name
   */
  abstract get toolkit(): string

  /**
   * Tool description
   */
  abstract get description(): string

  /**
   * Execute a command with proper Leon messaging and progress tracking
   */
  protected async executeCommand(
    options: ExecuteCommandOptions
  ): Promise<string> {
    const {
      binaryName,
      args,
      options: execOptions = {},
      onProgress,
      onOutput
    } = options
    const { sync = false } = execOptions

    // Get binary path (auto-downloads if needed)
    const binaryPath = await this.getBinaryPath(binaryName)
    const commandString = `"${binaryPath}" ${args.join(' ')}`

    // Generate a unique group ID for this command execution
    const toolGroupId = `${this.toolkit}_${this.toolName}_${Date.now()}`

    await leon.answer({
      key: 'bridges.tools.executing_command',
      data: {
        binary_name: binaryName,
        command: commandString
      },
      core: {
        isToolOutput: true,
        toolkitName: this.toolkit,
        toolName: this.toolName,
        toolGroupId: toolGroupId
      }
    })

    if (sync) {
      return this.executeSyncCommand(
        binaryPath,
        args,
        commandString,
        execOptions,
        toolGroupId
      )
    } else {
      return this.executeAsyncCommand(
        binaryPath,
        args,
        commandString,
        execOptions,
        toolGroupId,
        onProgress,
        onOutput
      )
    }
  }

  /**
   * Execute command synchronously
   */
  private executeSyncCommand(
    binaryPath: string,
    args: string[],
    commandString: string,
    execOptions: ExecuteCommandOptions['options'] = {},
    toolGroupId: string
  ): string {
    try {
      const startTime = Date.now()

      const result = execSync(`"${binaryPath}" ${args.join(' ')}`, {
        encoding: execOptions.encoding || 'utf8',
        timeout: execOptions.timeout,
        cwd: execOptions.cwd
      })

      const executionTime = Date.now() - startTime

      leon.answer({
        key: 'bridges.tools.command_completed',
        data: {
          command: commandString,
          execution_time: `${executionTime}ms`
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName,
          toolGroupId: toolGroupId
        }
      })

      return result as string
    } catch (error: unknown) {
      leon.answer({
        key: 'bridges.tools.command_failed',
        data: {
          command: commandString,
          error: (error as Error).message
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName,
          toolGroupId: toolGroupId
        }
      })
      throw error
    }
  }

  /**
   * Execute command asynchronously with progress tracking
   */
  private executeAsyncCommand(
    binaryPath: string,
    args: string[],
    commandString: string,
    execOptions: ExecuteCommandOptions['options'] = {},
    toolGroupId: string,
    onProgress?: ProgressCallback,
    onOutput?: (data: string, isError?: boolean) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      let outputBuffer = ''

      const childProcess = spawn(binaryPath, args, {
        cwd: execOptions.cwd
      })

      // Handle stdout
      childProcess.stdout.on('data', (data) => {
        const output = data.toString()
        outputBuffer += output

        if (onOutput) {
          onOutput(output, false)
        }

        // Call progress callback if provided
        if (onProgress) {
          onProgress({ status: 'running' })
        }
      })

      // Handle stderr
      childProcess.stderr.on('data', (data) => {
        const output = data.toString()
        outputBuffer += output

        if (onOutput) {
          onOutput(output, true)
        }
      })

      // Handle process completion
      childProcess.on('close', async (code) => {
        const executionTime = Date.now() - startTime

        if (code === 0) {
          await leon.answer({
            key: 'bridges.tools.command_completed',
            data: {
              command: commandString,
              execution_time: `${executionTime}ms`
            },
            core: {
              isToolOutput: true,
              toolkitName: this.toolkit,
              toolName: this.toolName,
              toolGroupId: toolGroupId
            }
          })

          if (onProgress) {
            onProgress({ status: 'completed', percentage: 100 })
          }

          resolve(outputBuffer)
        } else {
          await leon.answer({
            key: 'bridges.tools.command_failed',
            data: {
              command: commandString,
              exit_code: code?.toString() || 'unknown',
              execution_time: `${executionTime}ms`
            },
            core: {
              isToolOutput: true,
              toolkitName: this.toolkit,
              toolName: this.toolName,
              toolGroupId: toolGroupId
            }
          })
          reject(
            new Error(`Command failed with exit code ${code}: ${outputBuffer}`)
          )
        }
      })

      // Handle process errors
      childProcess.on('error', async (error) => {
        await leon.answer({
          key: 'bridges.tools.command_error',
          data: {
            command: commandString,
            error: error.message
          },
          core: {
            isToolOutput: true,
            toolkitName: this.toolkit,
            toolName: this.toolName,
            toolGroupId: toolGroupId
          }
        })
        reject(error)
      })

      // Handle timeout
      if (execOptions.timeout) {
        setTimeout(() => {
          childProcess.kill('SIGTERM')
          leon.answer({
            key: 'bridges.tools.command_timeout',
            data: {
              command: commandString,
              timeout: `${execOptions.timeout}ms`
            },
            core: {
              isToolOutput: true,
              toolkitName: this.toolkit,
              toolName: this.toolName,
              toolGroupId: toolGroupId
            }
          })
          reject(new Error(`Command timed out after ${execOptions.timeout}ms`))
        }, execOptions.timeout)
      }
    })
  }

  /**
   * Get binary path and ensure it's downloaded
   */
  async getBinaryPath(binaryName: string): Promise<string> {
    // Get tool name without "Tool" suffix for config lookup
    const toolConfigName = this.toolName.toLowerCase().replace('tool', '')
    const config = ToolkitConfig.load(this.toolkit, toolConfigName)
    const binaryUrl = ToolkitConfig.getBinaryUrl(config)

    await leon.answer({
      key: 'bridges.tools.checking_binary',
      data: {
        binary_name: binaryName
      },
      core: {
        isToolOutput: true,
        toolkitName: this.toolkit,
        toolName: this.toolName
      }
    })

    if (!binaryUrl) {
      await leon.answer({
        key: 'bridges.tools.no_binary_url',
        data: {
          binary_name: binaryName
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })
      throw new Error(`No download URL found for binary '${binaryName}'`)
    }

    // Extract the actual filename from the URL
    const urlPath = new URL(binaryUrl).pathname
    const actualFilename = path.basename(urlPath)
    const executable =
      isWindows() && !actualFilename.endsWith('.exe')
        ? `${actualFilename}.exe`
        : actualFilename

    const binsPath = path.join(TOOLKITS_PATH, this.toolkit, 'bins')

    // Ensure toolkit bins directory exists
    if (!fs.existsSync(binsPath)) {
      await leon.answer({
        key: 'bridges.tools.creating_bins_directory',
        data: {
          toolkit: this.toolkit
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })
      fs.mkdirSync(binsPath, { recursive: true })
    }

    const binaryPath = path.join(binsPath, executable)

    // Ensure binary is available before returning path
    if (!fs.existsSync(binaryPath)) {
      await this.downloadBinaryOnDemand(binaryName, binaryUrl, executable)
    }

    /**
     * Force chmod again in case it has been downloaded but somehow failed
     * so it could not chmod correctly earlier
     */
    if (!isWindows()) {
      await leon.answer({
        key: 'bridges.tools.applying_permissions',
        data: {
          binary_name: binaryName
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })
      fs.chmodSync(binaryPath, 0o755)
    }

    await leon.answer({
      key: 'bridges.tools.binary_ready',
      data: {
        binary_name: binaryName
      },
      core: {
        isToolOutput: true,
        toolkitName: this.toolkit,
        toolName: this.toolName
      }
    })

    return binaryPath
  }

  /**
   * Download binary on-demand if not found
   */
  private async downloadBinaryOnDemand(
    binaryName: string,
    binaryUrl: string,
    executable: string
  ): Promise<void> {
    try {
      const binsPath = path.join(TOOLKITS_PATH, this.toolkit, 'bins')
      const binaryPath = path.join(binsPath, executable)

      await leon.answer({
        key: 'bridges.tools.binary_not_found',
        data: {
          binary_name: binaryName
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })

      await this.downloadBinary(binaryUrl, binaryPath)

      await leon.answer({
        key: 'bridges.tools.binary_downloaded',
        data: {
          binary_name: binaryName
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })

      // Make binary executable (Unix systems)
      if (!isWindows()) {
        await leon.answer({
          key: 'bridges.tools.making_executable',
          data: {
            binary_name: binaryName
          },
          core: {
            isToolOutput: true,
            toolkitName: this.toolkit,
            toolName: this.toolName
          }
        })
        fs.chmodSync(binaryPath, 0o755)
      }

      // Remove quarantine attribute on macOS to prevent Gatekeeper blocking
      if (isMacOS()) {
        await this.removeQuarantineAttribute(binaryPath)
      }
    } catch (error) {
      await leon.answer({
        key: 'bridges.tools.download_failed',
        data: {
          binary_name: binaryName,
          error: (error as Error).message
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })
      throw new Error(
        `Failed to download binary '${binaryName}': ${(error as Error).message}`
      )
    }
  }

  /**
   * Download binary from URL using axios (matches Python urllib pattern)
   */
  private async downloadBinary(url: string, outputPath: string): Promise<void> {
    try {
      await leon.answer({
        key: 'bridges.tools.downloading_from_url',
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })

      const response = await axios.get(url, { responseType: 'arraybuffer' })

      fs.writeFileSync(outputPath, response.data)
    } catch (error) {
      await leon.answer({
        key: 'bridges.tools.download_url_failed',
        data: {
          error: (error as Error).message
        },
        core: {
          isToolOutput: true,
          toolkitName: this.toolkit,
          toolName: this.toolName
        }
      })
      throw new Error(`Failed to download binary: ${(error as Error).message}`)
    }
  }

  /**
   * Remove macOS quarantine attribute to prevent Gatekeeper blocking
   */
  private async removeQuarantineAttribute(filePath: string): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const command = `xattr -d com.apple.quarantine "${filePath}"`

        await leon.answer({
          key: 'bridges.tools.removing_quarantine',
          data: {
            command
          },
          core: {
            isToolOutput: true,
            toolkitName: this.toolkit,
            toolName: this.toolName
          }
        })
        // Use xattr to remove the com.apple.quarantine extended attribute
        const xattr = spawn('xattr', ['-d', 'com.apple.quarantine', filePath])

        xattr.on('close', async (code) => {
          if (code === 0) {
            await leon.answer({
              key: 'bridges.tools.quarantine_removed',
              data: {
                file_name: path.basename(filePath)
              },
              core: {
                isToolOutput: true,
                toolkitName: this.toolkit,
                toolName: this.toolName
              }
            })
          } else {
            // Don't fail the entire process if quarantine removal fails
            await leon.answer({
              key: 'bridges.tools.quarantine_warning',
              data: {
                file_name: path.basename(filePath),
                exit_code: code?.toString() ?? 'unknown'
              },
              core: {
                isToolOutput: true,
                toolkitName: this.toolkit,
                toolName: this.toolName
              }
            })
          }

          resolve()
        })

        xattr.on('error', async (error) => {
          // Don't fail the entire process if quarantine removal fails
          await leon.answer({
            key: 'bridges.tools.quarantine_error',
            data: {
              file_name: path.basename(filePath),
              error: error.message
            },
            core: {
              isToolOutput: true,
              toolkitName: this.toolkit,
              toolName: this.toolName
            }
          })

          resolve()
        })
      } catch (error) {
        // Don't fail the entire process if quarantine removal fails
        leon
          .answer({
            key: 'bridges.tools.quarantine_exception',
            data: {
              file_name: path.basename(filePath),
              error: (error as Error).message
            },
            core: {
              isToolOutput: true,
              toolkitName: this.toolkit,
              toolName: this.toolName
            }
          })
          .then(() => resolve())
      }
    })
  }
}
