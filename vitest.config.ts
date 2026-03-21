import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url))

dotenv.config({ path: path.join(ROOT_DIR, '.env') })

export default defineConfig({
  resolve: {
    alias: {
      '@@': ROOT_DIR,
      '@': path.join(ROOT_DIR, 'server', 'src'),
      '@bridge': path.join(ROOT_DIR, 'bridges', 'nodejs', 'src'),
      '@sdk': path.join(ROOT_DIR, 'bridges', 'nodejs', 'src', 'sdk')
    }
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    disableConsoleIntercept: true,
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    testTimeout: 120_000
  }
})
