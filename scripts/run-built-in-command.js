import { BUILT_IN_COMMAND_MANAGER } from '@/commands'

const TERMINAL_ARG_START_INDEX = 2
const COMMAND_ARG_DELIMITER = ' '
const PNPM_ARGS_SEPARATOR = '--'
const COMMAND_PREFIX = '/'

async function run() {
  const rawInput = process.argv
    .slice(TERMINAL_ARG_START_INDEX)
    .filter((argument) => argument !== PNPM_ARGS_SEPARATOR)
    .join(COMMAND_ARG_DELIMITER)
    .trim()

  if (!rawInput) {
    console.error('Please provide a built-in command. Example: pnpm cmd help')
    process.exitCode = 1
    return
  }

  if (rawInput.startsWith(COMMAND_PREFIX)) {
    console.error('Please run built-in commands without "/". Example: pnpm cmd help')
    process.exitCode = 1
    return
  }

  const response = await BUILT_IN_COMMAND_MANAGER.execute(
    `${COMMAND_PREFIX}${rawInput}`
  )

  for (const line of response.result.plain_text) {
    console.log(line)
  }

  if (response.status === 'error') {
    process.exitCode = 1
  }
}

void run()
