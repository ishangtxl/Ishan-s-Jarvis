import ollama
from app.config import get_settings
from typing import List, Dict, Generator, AsyncGenerator, Any

settings = get_settings()

class LLMService:
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.client = ollama.AsyncClient(host=settings.OLLAMA_BASE_URL)

    async def chat_stream(self, messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat responses from Ollama.
        Yields chunks of the response.
        """
        try:
            async for part in await self.client.chat(model=self.model, messages=messages, stream=True, tools=tools):
                yield part['message']
        except Exception as e:
            # Fallback or error handling
            yield {"content": f"Error connecting to LLM: {str(e)}", "role": "assistant"}

    async def generate_response(self, prompt: str, system_prompt: str = None) -> str:
        """
        Generate a single response (non-streaming).
        """
        messages = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': prompt})
        
        response = await self.client.chat(model=self.model, messages=messages, stream=False)
        return response['message']['content']

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using nomic-embed-text.
        """
        try:
            response = await self.client.embeddings(model=settings.EMBEDDING_MODEL, prompt=text)
            return response['embedding']
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []

llm_service = LLMService()
