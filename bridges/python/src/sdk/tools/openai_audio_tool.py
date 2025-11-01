import subprocess

from ..base_tool import BaseTool
from ..toolkit_config import ToolkitConfig
from ..network import Network


class OpenAIAudioTool(BaseTool):
    TOOLKIT = 'music_audio'

    def __init__(self):
        super().__init__()
        self.config = ToolkitConfig.load(self.TOOLKIT, self.tool_name)
        self.network = Network({'base_url': 'https://api.openai.com'})

    @property
    def tool_name(self) -> str:
        # Use the actual config name for toolkit lookup
        return 'openai_audio'

    @property
    def toolkit(self) -> str:
        return self.TOOLKIT

    @property
    def description(self) -> str:
        return self.config['description']

    def transcribe_to_file(self, input_path: str, output_path: str, api_key: str, model: str = 'whisper-1') -> str:
        """
        Transcribe audio to a file using OpenAI's audio transcription API via SDK Network

        Args:
            input_path: Path to the audio file to transcribe
            output_path: Path to save the plain text transcription
            api_key: OpenAI API key
            model: Transcription model (e.g. 'whisper-1')
        Returns:
            The path to the transcription file
        """
        if not api_key:
            raise Exception('OpenAI API key is missing')

        try:
            files: dict = {
                'file': open(input_path, 'rb')
            }
            data: dict = {
                'model': model,
                'response_format': 'text'
            }

            response = self.network.request({
                'url': '/v1/audio/transcriptions',
                'method': 'POST',
                'headers': {
                    'Authorization': f'Bearer {api_key}'
                },
                'data': data,
                'files': files,
                'use_json': False
            })

            # response.data can be plain text; ensure it's a string
            text = response['data'] if isinstance(response['data'], str) else str(response['data'])

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)

            return output_path
        except Exception as e:
            raise Exception(f'OpenAI transcription failed: {str(e)}')
