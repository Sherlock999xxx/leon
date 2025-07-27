from bridges.python.src.sdk.leon import leon
from bridges.python.src.sdk.types import ActionParams


def run(params: ActionParams) -> None:
    """Leon tells about partner assistants"""

    try:
        assistant_name = params['action_arguments']['assistant_name'].lower()
        leon.answer({
            'key': assistant_name
        })
    except BaseException:
        return leon.answer({'key': 'not_found'})
