from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models.task import Task, CalendarEvent
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
