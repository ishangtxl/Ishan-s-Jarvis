from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import shutil
import os

from app.database import get_db
from app.models.project import Project, ProjectFile
from app import schemas
from app.config import get_settings
from app.services.file_service import read_file_content
from app.services.rag_service import rag_service

settings = get_settings()
router = APIRouter()

@router.get("/projects", response_model=List[schemas.Project])
async def read_projects(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    # Load projects and count files (simulated count for now or explicit query)
    result = await db.execute(select(Project).options(selectinload(Project.files)).offset(skip).limit(limit))
    projects = result.scalars().all()
    
    # Populate file_count
    for p in projects:
        p.file_count = len(p.files)
        
    return projects

@router.post("/projects", response_model=schemas.Project)
async def create_project(project: schemas.ProjectCreate, db: AsyncSession = Depends(get_db)):
    db_project = Project(**project.model_dump())
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.get("/projects/{project_id}", response_model=schemas.Project)
async def read_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).options(selectinload(Project.files)).where(Project.id == project_id))
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_project.file_count = len(db_project.files)
    return db_project

@router.get("/projects/{project_id}/files", response_model=List[schemas.ProjectFile])
async def read_project_files(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectFile).where(ProjectFile.project_id == project_id))
    return result.scalars().all()

@router.post("/projects/{project_id}/upload", response_model=schemas.ProjectFile)
async def upload_file(project_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # 1. Verify Project
    result = await db.execute(select(Project).where(Project.id == project_id))
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Save to Disk
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 3. Read Content & Index
    # Reset file pointer for reading content after save (or read before save)
    # UploadFile file-like object is at the end after copyfileobj?
    # Actually better to read content, then write content to file.
    # But read_file_content is async and uses UploadFile methods.
    
    await file.seek(0)
    content = await read_file_content(file)
    
    # 4. Upsert to RAG
    file_id = f"proj_{project_id}_{file.filename}"
    await rag_service.upsert_document(
        text=content,
        metadata={
            "project_id": int(project_id),  # Ensure integer for Pinecone filtering
            "filename": file.filename,
            "type": "project_file"
        },
        namespace="default"  # Use default namespace with metadata filtering
    )

    # 5. Create DB Entry
    db_file = ProjectFile(
        project_id=project_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file.filename.split('.')[-1],
        pinecone_id=file_id,
        summary=content[:200] + "..." # specific summary generation later
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    return db_file
