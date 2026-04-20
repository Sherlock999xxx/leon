import sys
import json
import os

import version

DEFAULT_LEON_PROFILE = "just-me"


def resolve_leon_app_root() -> str:
    return os.path.abspath(os.getenv("LEON_APP_ROOT", os.getcwd()))


def resolve_leon_home() -> str:
    configured_leon_home = os.getenv("LEON_HOME", "").strip()

    if configured_leon_home:
        return os.path.abspath(configured_leon_home)

    return os.path.join(os.path.expanduser("~"), ".leon")


def resolve_leon_profile() -> str:
    return os.getenv("LEON_PROFILE", "").strip() or DEFAULT_LEON_PROFILE


def resolve_leon_profile_path() -> str:
    return os.path.join(resolve_leon_home(), "profiles", resolve_leon_profile())


argv = sys.argv[1:]
if "--runtime" in argv:
    runtime_index = argv.index("--runtime")
    argv = [
        arg
        for index, arg in enumerate(argv)
        if index not in (runtime_index, runtime_index + 1)
    ]

INTENT_OBJ_FILE_PATH = argv[0] if argv else None
if not INTENT_OBJ_FILE_PATH:
    raise Exception("Missing intent object path for skill runtime.")

with open(INTENT_OBJ_FILE_PATH, "r", encoding="utf-8") as f:
    INTENT_OBJECT = json.load(f)

APP_ROOT_PATH = resolve_leon_app_root()
LEON_HOME_PATH = resolve_leon_home()
LEON_PROFILE_PATH = resolve_leon_profile_path()
LEON_TOOLKITS_PATH = os.path.join(LEON_HOME_PATH, "toolkits")
PROFILE_SKILLS_PATH = os.path.join(LEON_PROFILE_PATH, "skills")
PROFILE_TOOLS_PATH = os.path.join(LEON_PROFILE_PATH, "tools")


def get_profile_skill_path(skill_name: str) -> str:
    return os.path.join(PROFILE_SKILLS_PATH, skill_name)


def get_profile_skill_settings_path(skill_name: str) -> str:
    return os.path.join(get_profile_skill_path(skill_name), "settings.json")


def get_profile_skill_memory_file_path(skill_name: str, memory_name: str) -> str:
    return os.path.join(get_profile_skill_path(skill_name), "memory", f"{memory_name}.json")


def get_profile_skill_runtime_path(skill_name: str) -> str:
    return os.path.join(get_profile_skill_path(skill_name), ".runtime")


def get_toolkit_assets_path(toolkit_name: str) -> str:
    return os.path.join(LEON_TOOLKITS_PATH, toolkit_name, "assets")


def get_profile_tool_settings_path(tool_name: str) -> str:
    return os.path.join(PROFILE_TOOLS_PATH, f"{tool_name}.settings.json")

SKILLS_ROOT_PATH = os.path.join(APP_ROOT_PATH, "skills")
BIN_PATH = os.path.join(LEON_HOME_PATH, "bin")
BRIDGES_PATH = os.path.join(APP_ROOT_PATH, "bridges")

NVIDIA_LIBS_PATH = os.path.join(BIN_PATH, "nvidia")

PYTORCH_PATH = os.path.join(BIN_PATH, "pytorch")
PYTORCH_TORCH_PATH = os.path.join(PYTORCH_PATH, "torch")

TOOLKITS_PATH = os.path.join(BRIDGES_PATH, "toolkits")

SKILL_PATH = os.path.join(SKILLS_ROOT_PATH, INTENT_OBJECT["skill_name"])

SKILLS_PATH = SKILLS_ROOT_PATH

SKILL_LOCALE_PATH = os.path.join(
    SKILL_PATH, "locales", f"{INTENT_OBJECT['extra_context']['lang']}.json"
)
if INTENT_OBJECT["skill_name"] and os.path.exists(SKILL_LOCALE_PATH):
    with open(SKILL_LOCALE_PATH, "r", encoding="utf-8") as f:
        SKILL_LOCALE_CONFIG_CONTENT = json.load(f)
else:
    SKILL_LOCALE_CONFIG_CONTENT = {
        "variables": {},
        "common_answers": {},
        "widget_contents": {},
        "actions": {INTENT_OBJECT["action_name"]: {}},
    }

SKILL_LOCALE_CONFIG = (
    SKILL_LOCALE_CONFIG_CONTENT.get("actions", {})
    .get(INTENT_OBJECT["action_name"], {})
    .copy()
)
SKILL_LOCALE_CONFIG["variables"] = SKILL_LOCALE_CONFIG_CONTENT.get("variables", {})
SKILL_LOCALE_CONFIG["common_answers"] = SKILL_LOCALE_CONFIG_CONTENT.get(
    "common_answers", {}
)
SKILL_LOCALE_CONFIG["widget_contents"] = SKILL_LOCALE_CONFIG_CONTENT.get(
    "widget_contents", {}
)

LEON_VERSION = os.getenv("npm_package_version")

PYTHON_BRIDGE_VERSION = version.__version__
