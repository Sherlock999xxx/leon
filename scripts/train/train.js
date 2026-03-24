import dotenv from 'dotenv'

import { createSetupStatus } from '../setup/setup-status'

import trainSkillRouterDuty from './train-skill-router-duty.js'

dotenv.config()

/**
 * Training utterance samples script
 *
 * npm run train [en or fr]
 */
export default () =>
  new Promise(async (resolve, reject) => {
    const status = createSetupStatus('Training the skill router...').start()

    try {
      try {
        await trainSkillRouterDuty()

        status.succeed('Skill router: ready')
        resolve()
      } catch {
        status.fail('Failed to train the skill router')
        reject()
      }
    } catch (e) {
      status.fail('Failed to train the skill router')
      reject(e)
    }
  })
