import ora from 'ora'

/**
 * Create a setup spinner that plays well with prompts and download output.
 */
export function createSetupStatus(text) {
  return ora({
    spinner: 'dots2',
    color: 'cyan',
    text,
    stream: process.stdout,
    discardStdin: false
  })
}
