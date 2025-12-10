from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="backlog") # backlog, todo, in_progress, done
    priority = Column(String, default="med") # low, med, high
    tag = Column(String, default="GEN")
    deadline = Column(DateTime, nullable=True)
    user_initials = Column(String, nullable=True) # e.g. "ME" or "AI"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to calendar event if linked
    events = relationship("CalendarEvent", back_populates="task")

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    all_day = Column(Boolean, default=False)
    type = Column(String, default="event") # meeting, work, etc.
    
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    task = relationship("Task", back_populates="events")

    created_at = Column(DateTime, default=datetime.utcnow)
