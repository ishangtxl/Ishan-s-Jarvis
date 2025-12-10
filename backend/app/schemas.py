from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "backlog"
    priority: str = "med"
    tag: Optional[str] = "GEN"
    deadline: Optional[datetime] = None
    user_initials: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class TaskFile(BaseModel):
    id: int
    filename: str
    file_type: str
    summary: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Calendar Schemas ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    type: str = "event"
    task_id: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class Event(EventBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    tags: List[str] = []

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    file_count: int = 0 # Computed field
    
    class Config:
        from_attributes = True

class ProjectFile(BaseModel):
    id: int
    filename: str
    file_type: str
    summary: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Chat Schemas ---
class MessageBase(BaseModel):
    role: str
    content: str
    type: str = "text"
    timestamp: Optional[datetime] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    session_id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: str = "New Chat"

class ChatSession(ChatSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []
    class Config:
        from_attributes = True

class ChatSessionSummary(ChatSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Memory Schemas ---
class MemoryBase(BaseModel):
    content: str
    category: str = "general"

class MemoryCreate(MemoryBase):
    pass

class Memory(MemoryBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- LLM/Agent Schemas ---
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None # 'new' or int ID
    model: Optional[str] = None
    
class ChatResponse(BaseModel):
    response: str
    session_id: int
