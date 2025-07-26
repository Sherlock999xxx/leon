import sys
import json
import os

import version

INTENT_OBJ_FILE_PATH = sys.argv[1]

with open(INTENT_OBJ_FILE_PATH, 'r', encoding='utf-8') as f:
    INTENT_OBJECT = json.load(f)

SKILLS_ROOT_PATH = os.path.join(
    os.getcwd(),
    'skills'
)

SKILL_PATH = os.path.join(
    SKILLS_ROOT_PATH,
    INTENT_OBJECT['skill_name']
)

SKILLS_PATH = SKILLS_ROOT_PATH

SKILL_LOCALE_PATH = os.path.join(
    SKILL_PATH,
    'locales',
    f"{INTENT_OBJECT['extra_context']['lang']}.json"
)
SKILL_LOCALE_CONFIG = {}
if os.path.exists(SKILL_LOCALE_PATH):
    with open(SKILL_LOCALE_PATH, 'r', encoding='utf-8') as f:
        SKILL_LOCALE_CONFIG = json.load(f)
else:
    SKILL_LOCALE_CONFIG = {
        "actions": {
            INTENT_OBJECT['action_name']: {}
        }
    }

with open(os.path.join(SKILL_PATH, 'config', INTENT_OBJECT['extra_context']['lang'] + '.json'), 'r') as f:
    SKILL_CONFIG = json.load(f)

SKILL_CONFIG.update(
    SKILL_LOCALE_CONFIG.get('actions', {}).get(INTENT_OBJECT['action_name'], {})
)

LEON_VERSION = os.getenv('npm_package_version')

PYTHON_BRIDGE_VERSION = version.__version__
