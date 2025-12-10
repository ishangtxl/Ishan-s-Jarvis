from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class MemoryEntry(Base):
    __tablename__ = "memory_entries"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    category = Column(String, default="general") # personal, work, preferences
    pinecone_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
