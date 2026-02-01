import json
import os
from typing import Dict, Any, Optional

from .utils import get_platform_name


class ToolkitConfig:
    """Toolkit configuration loader"""

    _config_cache: Dict[str, Dict[str, Any]] = {}
    _settings_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def load(cls, toolkit_name: str, tool_name: str) -> Dict[str, Any]:
        """
        Load tool configuration from bridges/toolkits directory
        
        Args:
            toolkit_name: The toolkit name (e.g., 'video_streaming')
            tool_name: Name of the tool (e.g., 'ffmpeg')
        """
        cache_key = toolkit_name

        # Load toolkit config if not cached
        if cache_key not in cls._config_cache:
            config_path = os.path.join(os.getcwd(), 'bridges', 'toolkits', toolkit_name, 'toolkit.json')

            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    toolkit_config = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                raise Exception(f"Failed to load toolkit config from '{config_path}': {str(e)}")

            cls._config_cache[cache_key] = toolkit_config

        toolkit_config = cls._config_cache[cache_key]
        tools_config = toolkit_config.get('tools', {})
        tool_config = tools_config.get(tool_name)

        if not tool_config:
            toolkit_name_display = toolkit_config.get('name', 'unknown')
            raise Exception(f"Tool '{tool_name}' not found in toolkit '{toolkit_name_display}'")

        return tool_config

    @classmethod
    def load_settings(cls, toolkit_name: str) -> Dict[str, Any]:
        """
        Load toolkit settings from bridges/toolkits directory

        Args:
            toolkit_name: The toolkit name (e.g., 'video_streaming')
        """
        cache_key = toolkit_name

        if cache_key not in cls._settings_cache:
            settings_path = os.path.join(
                os.getcwd(),
                'bridges',
                'toolkits',
                toolkit_name,
                'settings.json'
            )

            try:
                with open(settings_path, 'r', encoding='utf-8') as f:
                    settings_config = json.load(f)
            except FileNotFoundError:
                settings_config = {}
            except json.JSONDecodeError as e:
                raise Exception(
                    f"Failed to load toolkit settings from '{settings_path}': {str(e)}"
                )

            cls._settings_cache[cache_key] = settings_config

        return cls._settings_cache[cache_key]

    @classmethod
    def load_tool_settings(cls, toolkit_name: str, tool_name: str) -> Dict[str, Any]:
        """
        Load tool-specific settings from toolkit settings file

        Args:
            toolkit_name: The toolkit name (e.g., 'video_streaming')
            tool_name: Name of the tool (e.g., 'ffmpeg')
        """
        settings = cls.load_settings(toolkit_name)
        tool_settings = settings.get(tool_name)

        if isinstance(tool_settings, dict):
            return tool_settings

        return {}

    @classmethod
    def get_binary_url(cls, config: Dict[str, Any]) -> Optional[str]:
        """Get binary download URL for current platform with architecture granularity"""
        platform_name = get_platform_name()
        binaries = config.get('binaries', {})

        return binaries.get(platform_name)
