from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Ensure the data directory exists (handled by mkdir script, but good for safety)
# SQLite url in config is relative, but usually needs absolute for safety or correct relative path handling.
# For simplicity with aiosqlite in this structure:
database_url = settings.DATABASE_URL

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    connect_args={"check_same_thread": False}, # Needed for SQLite
)

AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
