import { command } from 'execa'

import { LogHelper } from '@/helpers/log-helper'

async function runBuildStep(stepName, commandText) {
  LogHelper.info(stepName)
  await command(commandText, {
    shell: true,
    stdio: 'inherit'
  })
}

/**
 * Build the production server output and copy runtime assets that TypeScript
 * does not emit by itself.
 */
;(async () => {
  try {
    await runBuildStep('Deleting server dist...', 'npm run delete-dist:server')
    await runBuildStep('Training skill router duty...', 'npm run train')
    await runBuildStep('Compiling TypeScript...', 'tsc --project tsconfig.json')
    await runBuildStep('Resolving TS paths...', 'resolve-tspaths')
    await runBuildStep(
      'Reshaping server dist...',
      'shx rm -rf server/dist/core server/dist/package.json && shx mv -f server/dist/server/src/* server/dist && shx rm -rf server/dist/server'
    )
    await runBuildStep(
      'Copying runtime assets...',
      'shx mkdir -p server/dist/tmp server/dist/core/memory-manager/sql && shx cp -r server/src/core/memory-manager/sql/* server/dist/core/memory-manager/sql/'
    )
  } catch (e) {
    LogHelper.error(`Failed to build server: ${e}`)
    process.exit(1)
  }
})()
