import fs from 'node:fs'
import path from 'node:path'

import type { SkillConfigSchema } from '@/schemas/skill-schemas'

import type { IntentObject } from '@sdk/types'

const {
  argv: [, , INTENT_OBJ_FILE_PATH]
} = process

export const LEON_VERSION = process.env['npm_package_version']

const BRIDGES_PATH = path.join(process.cwd(), 'bridges')
const NODEJS_BRIDGE_ROOT_PATH = path.join(BRIDGES_PATH, 'nodejs')
const NODEJS_BRIDGE_SRC_PATH = path.join(NODEJS_BRIDGE_ROOT_PATH, 'src')
const NODEJS_BRIDGE_VERSION_FILE_PATH = path.join(
  NODEJS_BRIDGE_SRC_PATH,
  'version.ts'
)

export const [, NODEJS_BRIDGE_VERSION] = fs
  .readFileSync(NODEJS_BRIDGE_VERSION_FILE_PATH, 'utf8')
  .split("'")

export const INTENT_OBJECT: IntentObject = JSON.parse(
  fs.readFileSync(INTENT_OBJ_FILE_PATH as string, 'utf8')
)

export const SKILLS_PATH = path.join(process.cwd(), 'skills')
export const SKILL_PATH = path.join(SKILLS_PATH, INTENT_OBJECT.skill_name)
const SKILL_LOCALE_PATH = path.join(
  SKILL_PATH,
  'locales',
  INTENT_OBJECT.extra_context.lang + '.json'
)
const SKILL_LOCALE_CONFIG = JSON.parse(
  fs.existsSync(SKILL_LOCALE_PATH)
    ? fs.readFileSync(SKILL_LOCALE_PATH, 'utf8')
    : `{"actions": {"${INTENT_OBJECT.action_name}": {}}}`
)

export const SKILL_CONFIG: SkillConfigSchema = {
  ...JSON.parse(
    fs.readFileSync(
      path.join(
        SKILL_PATH,
        'config',
        INTENT_OBJECT.extra_context.lang + '.json'
      ),
      'utf8'
    )
  ),
  ...SKILL_LOCALE_CONFIG.actions[INTENT_OBJECT.action_name]
}
