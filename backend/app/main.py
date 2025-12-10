from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from contextlib import asynccontextmanager

# Import models to ensure they are registered with Base
import app.models 

from app.routers import chat, tasks, projects, memory

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"]) # /api/tasks, /api/events
app.include_router(projects.router, prefix="/api", tags=["projects"]) # /api/projects
app.include_router(memory.router, prefix="/api", tags=["memory"]) # /api/memory

@app.get("/health")
async def health_check():
    return {"status": "online", "model": settings.LLM_MODEL}

@app.get("/")
async def root():
    return {"message": "Jarvis Backend Operational"}
