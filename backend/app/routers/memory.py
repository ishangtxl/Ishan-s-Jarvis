from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models.memory import MemoryEntry
from app import schemas

router = APIRouter()

@router.get("/memory", response_model=List[schemas.Memory])
async def read_memory(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MemoryEntry).order_by(MemoryEntry.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/memory", response_model=schemas.Memory)
async def create_memory(memory: schemas.MemoryCreate, db: AsyncSession = Depends(get_db)):
    db_memory = MemoryEntry(**memory.model_dump())
    db.add(db_memory)
    await db.commit()
    await db.refresh(db_memory)
    
    # In Phase 3, we will add this to Pinecone index here or via a service
    
    return db_memory

@router.delete("/memory/{memory_id}")
async def delete_memory(memory_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MemoryEntry).where(MemoryEntry.id == memory_id))
    db_memory = result.scalar_one_or_none()
    if not db_memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    await db.delete(db_memory)
    await db.commit()
    # In Phase 3, delete from Pinecone as well
    
    return {"message": "Memory deleted"}
