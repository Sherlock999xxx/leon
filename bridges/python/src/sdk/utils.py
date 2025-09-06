import platform
from typing import List


def format_file_path(file_path: str) -> str:
    """Formats a file path as a clickable path with proper delimiters
    
    Args:
        file_path: The absolute file path to format
        
    Returns:
        A formatted string that the client can detect and make clickable
        
    Example:
        format_file_path('/Users/john/video.mp4') # returns '[FILE_PATH]/Users/john/video.mp4[/FILE_PATH]'
    """
    return f"[FILE_PATH]{file_path}[/FILE_PATH]"


def format_file_paths(file_paths: List[str]) -> str:
    """Formats multiple file paths as a list of clickable paths
    
    Args:
        file_paths: List of absolute file paths
        
    Returns:
        A formatted string with multiple clickable paths
        
    Example:
        format_file_paths(['/path1', '/path2']) # returns '[FILE_PATH]/path1[/FILE_PATH], [FILE_PATH]/path2[/FILE_PATH]'
    """
    return ', '.join(format_file_path(path) for path in file_paths)


def get_platform_name() -> str:
    """Get platform name with architecture granularity (matches system-helper.ts)
    
    Returns:
        Platform name string (e.g., 'linux-x86_64', 'macosx-arm64', 'win-amd64')
        
    Example:
        get_platform_name() # returns 'macosx-arm64' on Apple Silicon Mac
    """
    system = platform.system().lower()
    architecture = platform.machine().lower()

    if system == 'linux':
        if architecture in ['x86_64', 'amd64']:
            return 'linux-x86_64'
        elif architecture in ['aarch64', 'arm64']:
            return 'linux-aarch64'
        else:
            # Default to x86_64 for unknown architectures on Linux
            return 'linux-x86_64'

    elif system == 'darwin':
        if architecture in ['arm64', 'aarch64'] or 'apple' in platform.processor().lower():
            return 'macosx-arm64'
        else:
            return 'macosx-x86_64'

    elif system == 'windows':
        return 'win-amd64'

    else:
        return 'unknown'


def is_windows() -> bool:
    """Check if current platform is Windows
    
    Returns:
        True if running on Windows, False otherwise
        
    Example:
        if is_windows(): executable_name += '.exe'
    """
    return get_platform_name().startswith('win')


def is_macos() -> bool:
    """Check if current platform is macOS
    
    Returns:
        True if running on macOS, False otherwise
        
    Example:
        if is_macos(): remove_quarantine_attribute(binary_path)
    """
    return get_platform_name().startswith('macosx')


def is_linux() -> bool:
    """Check if current platform is Linux
    
    Returns:
        True if running on Linux, False otherwise
        
    Example:
        if is_linux(): check_system_package('ffmpeg')
    """
    return get_platform_name().startswith('linux')
