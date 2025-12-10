import asyncio
from app.database import engine, Base
from sqlalchemy import text

async def migrate():
    async with engine.begin() as conn:
        # Check if task_id column exists in chat_sessions
        try:
            # SQLite specific check
            result = await conn.execute(text("PRAGMA table_info(chat_sessions)"))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]
            
            if 'task_id' not in column_names:
                print("Migrating: Adding task_id to chat_sessions...")
                await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN task_id INTEGER REFERENCES tasks(id)"))
            else:
                print("Column task_id already exists in chat_sessions.")
                
            # Create new tables (TaskFile)
            print("Creating new tables if they don't exist...")
            await conn.run_sync(Base.metadata.create_all)
            print("Migration complete.")
            
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
