import { BuiltInCommandManager } from '@/commands/built-in-command-manager'
import { HelpCommand } from '@/commands/help-command'
import { RoutingCommand } from '@/commands/routing-command'
import { StatusCommand } from '@/commands/status-command'

const WHITELISTED_BUILT_IN_COMMAND_NAMES = ['status', 'routing', 'help']

const BUILT_IN_COMMANDS = [
  new StatusCommand(),
  new RoutingCommand(),
  new HelpCommand()
]
  .filter((command) =>
    WHITELISTED_BUILT_IN_COMMAND_NAMES.includes(command.getName())
  )

export const BUILT_IN_COMMAND_MANAGER = new BuiltInCommandManager(
  BUILT_IN_COMMANDS
)
