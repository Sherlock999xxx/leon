import { spawn, spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const pnpmCommand = isWindows ? 'pnpm.cmd' : 'pnpm'
const voltaCommand = isWindows ? 'volta.cmd' : 'volta'

function exitWithError(message) {
  console.error(`\x1b[31m✖ ${message}\x1b[0m`)
  process.exit(1)
}

function getNodeMajorVersion() {
  const [majorVersion] = process.versions.node.split('.')

  return Number.parseInt(majorVersion, 10)
}

function getCommandOutput(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.error || result.status !== 0) {
    return null
  }

  return result.stdout.trim()
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit'
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Command interrupted by ${signal}`))

        return
      }

      if (code === 0) {
        resolve()

        return
      }

      reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

if (getNodeMajorVersion() < 24) {
  exitWithError(
    `I require Node.js >= 24.0.0. Detected ${process.version}.`
  )
}

console.info('\x1b[36m➡ %s\x1b[0m', 'I\'m checking pnpm...')

const hasVolta = getCommandOutput(voltaCommand, ['--version']) !== null

console.info('\x1b[36m➡ %s\x1b[0m', 'I\'m installing pnpm...')

if (hasVolta) {
  await runCommand(voltaCommand, ['install', 'pnpm@latest'])
} else {
  await runCommand(npmCommand, ['install', '--global', 'pnpm@latest'])
}

await runCommand(pnpmCommand, ['install'])
