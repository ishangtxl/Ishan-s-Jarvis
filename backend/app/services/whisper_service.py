import os
import shutil
from fastapi import UploadFile
# faster-whisper is generally faster on CPU/GPU
# But lets stick to a simple implementation with `openai-whisper` or `faster-whisper`
# Installing `faster-whisper` is recommended.
# Check requirements.txt, I didn't add it yet. I need to add it.
# For now, I'll assume we can install it.

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

class WhisperService:
    def __init__(self):
        self.model = None
        self.model_size = "tiny" # or base, small. M3 can handle small/medium easily.
        self.initialized = False

    def initialize(self):
        if self.initialized:
            return
            
        if not WhisperModel:
            print("faster-whisper not installed. Voice disabled.")
            return

        try:
            # Run on CPU with INT8 by default to be safe, or "auto" for MPS if supported by faster-whisper
            # faster-whisper uses CTranslate2. M3 supports it.
            # device="cpu" is safest for generic setup without complex install.
            # device="auto" might pick cuda which fails on mac.
            # On Mac, 'cpu' with 'int8' is fast enough for single user.
            self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            self.initialized = True
            print(f"Whisper Model ({self.model_size}) Initialized")
        except Exception as e:
            print(f"Error initializing Whisper: {e}")

    async def transcribe(self, file: UploadFile) -> str:
        if not self.initialized:
            self.initialize()
            if not self.initialized:
                return "Error: Voice system not available."
        
        # Save temp file
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            segments, info = self.model.transcribe(temp_filename, beam_size=5)
            text = " ".join([segment.text for segment in segments])
            return text.strip()
        except Exception as e:
            return f"Error transcribing: {str(e)}"
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

whisper_service = WhisperService()
