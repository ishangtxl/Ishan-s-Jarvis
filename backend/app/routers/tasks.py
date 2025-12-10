from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import os
import shutil

from app.database import get_db
from app.models.task import Task, CalendarEvent, TaskFile
from app.models.chat import ChatSession
from app.services.rag_service import rag_service
from app import schemas

router = APIRouter()

# --- Tasks ---

@router.get("/tasks", response_model=List[schemas.Task])
async def read_tasks(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/tasks", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, db: AsyncSession = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=schemas.Task)
async def update_task(task_id: int, task: schemas.TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    db_task = result.scalar_one_or_none()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)
    
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    db_task = result.scalar_one_or_none()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(db_task)
    await db.commit()
    return {"message": "Task deleted"}

# --- Calendar Events ---

@router.get("/events", response_model=List[schemas.Event])
async def read_events(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/events", response_model=schemas.Event)
async def create_event(event: schemas.EventCreate, db: AsyncSession = Depends(get_db)):
    db_event = CalendarEvent(**event.model_dump())
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    return db_event

@router.delete("/events/{event_id}")
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    db_event = result.scalar_one_or_none()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(db_event)
    await db.commit()
    return {"message": "Event deleted"}

# --- Task Files & Chat ---

@router.get("/tasks/{task_id}/files", response_model=List[schemas.TaskFile])
async def read_task_files(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TaskFile).where(TaskFile.task_id == task_id))
    return result.scalars().all()

@router.post("/tasks/{task_id}/upload", response_model=schemas.TaskFile)
async def upload_task_file(task_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # 1. Verify task exists
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Save file to disk
    upload_dir = f"../data/uploads/tasks/{task_id}"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 3. Create DB Entry
    file_type = file.filename.split('.')[-1]
    db_file = TaskFile(
        task_id=task_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    # 4. Index in RAG (Task Context)
    # We pass metadata to filter by task_id later if needed, or simply project_id logic 
    # For now, we'll index it with metadata task_id
    try:
        await rag_service.index_file(file_path, metadata={"task_id": task_id, "filename": file.filename})
    except Exception as e:
        print(f"Error indexing file: {e}")
        # Non-blocking for now
        
    return db_file

@router.post("/tasks/{task_id}/chat", response_model=schemas.ChatSessionSummary)
async def get_task_chat_session(task_id: int, db: AsyncSession = Depends(get_db)):
    # Check if a session already exists for this task (get the most recent one)
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.task_id == task_id)
        .order_by(ChatSession.created_at.desc())
    )
    session = result.scalars().first()

    if session:
        return session

    # Create new session if not exists
    # Get task title for session name
    task_res = await db.execute(select(Task).where(Task.id == task_id))
    task = task_res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_session = ChatSession(title=f"Task: {task.title}", task_id=task_id)
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session
