import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Jarvis AI Assistant"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Compute absolute path for robustness
    _BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
    _DATA_DIR: str = os.path.join(os.path.dirname(_BASE_DIR), "data") # Jarvis/data
    
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_DATA_DIR}/jarvis.db"
    
    # LLM Settings (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    # User requested Gemma 3 4b, assuming tag 'gemma3:4b' or similar. 
    # Can be overridden by env var.
    LLM_MODEL: str = "qwen3:4b"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    
    # Vector DB (Pinecone)
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = "us-east-1" # Example default
    PINECONE_INDEX_NAME: str = "jarvis-memory"
    
    # Storage
    UPLOAD_DIR: str = os.path.join(_DATA_DIR, "uploads")

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
