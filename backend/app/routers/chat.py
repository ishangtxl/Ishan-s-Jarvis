from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db, AsyncSessionLocal
from app.models.chat import ChatSession, Message
from app import schemas
from app.services.llm_service import llm_service
from app.services.whisper_service import whisper_service

# ... (rest of imports)

# ... (existing endpoints)

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    text = await whisper_service.transcribe(file)
    return {"text": text}

# --- HTTP Endpoints ---

@router.get("/sessions", response_model=List[schemas.ChatSessionSummary])
async def read_sessions(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession)
        .order_by(ChatSession.updated_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.post("/sessions", response_model=schemas.ChatSessionSummary)
async def create_session(session: schemas.ChatSessionBase, db: AsyncSession = Depends(get_db)):
    db_session = ChatSession(**session.model_dump())
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}", response_model=schemas.ChatSession)
async def read_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id)
    )
    db_session = result.scalar_one_or_none()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.put("/sessions/{session_id}", response_model=schemas.ChatSessionSummary)
async def update_session(session_id: int, session: schemas.ChatSessionBase, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    db_session = result.scalar_one_or_none()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.title = session.title
    await db.commit()
    await db.refresh(db_session)
    return db_session

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    db_session = result.scalar_one_or_none()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(db_session)
    await db.commit()
    return {"message": "Session deleted"}

# --- WebSocket Endpoint ---

from app.services.rag_service import rag_service
from app.services.agent_service import agent_service

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    await websocket.accept()

    # Jarvis System Prompt
    from datetime import datetime
    import os
    from app.models.memory import MemoryEntry
    from app.models.project import Project

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Fetch Core Memories
    async with AsyncSessionLocal() as db:
        mem_result = await db.execute(select(MemoryEntry))
        memories = mem_result.scalars().all()
        memory_context = "\n".join([f"- [{m.category.upper()}] {m.content}" for m in memories])

        # Check if this is a project-specific chat session
        session_result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
        session = session_result.scalar_one_or_none()
        project_id = None
        if session and session.title.startswith("Project:"):
            # Extract project name from title "Project: {name}"
            project_name = session.title.replace("Project:", "").strip()
            project_result = await db.execute(select(Project).where(Project.name == project_name))
            project = project_result.scalar_one_or_none()
            if project:
                project_id = project.id

    SYSTEM_PROMPT = f"""You are Jarvis, a highly advanced personal AI assistant.
    You have access to the user's projects, tasks, calendar, and preferences via a RAG system.
    Current Date and Time: {current_time}

    CORE MEMORIES (USER PREFERENCES & CONTEXT):
    {memory_context if memory_context else "No core memories set."}

    GUIDELINES:
    1. Be concise, helpful, and professional but friendly.
    2. If context is provided, prioritize it for your answer.
    3. If you perform an action (like creating a task), mention it clearly.
    4. You are running locally on the user's machine.
    """

    try:
        while True:
            data = await websocket.receive_text()

            # --- Turn Loop (User Msg + Agents) ---
            # 1. Save User Message
            async with AsyncSessionLocal() as db:
                user_msg = Message(session_id=session_id, role="user", content=data)
                db.add(user_msg)
                await db.commit()

            # 2. Retrieve RAG Context (filtered by project if applicable)
            rag_filter = {"project_id": project_id} if project_id else None
            context_docs = await rag_service.query_context(data, filter=rag_filter)
            context_str = ""
            if context_docs:
                context_str = "\nRELEVANT CONTEXT FROM FILES/MEMORY:\n"
                for i, doc in enumerate(context_docs):
                    context_str += f"[{i+1}] {doc['text']} (Source: {doc['metadata'].get('filename', 'memory')})\n"
                context_str += "\nEND CONTEXT\n"

            # 3. Prepare Initial Messages
            llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            
            # Fetch history
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Message)
                    .where(Message.session_id == session_id)
                    .order_by(Message.timestamp.asc())
                )
                history = result.scalars().all()
                
            for msg in history:
                # Skip the one we just added (it's in history now) to handle it specially with context?
                # Actually simpler: Just use history, but update the last user message content in `llm_messages` (in memory only)
                content = msg.content
                if msg.id == history[-1].id and msg.role == 'user' and context_str:
                    content = f"{context_str}\n\nUser Query: {msg.content}"
                
                # Convert DB msg to Ollama format
                # Note: Ollama expects 'images' key if any, and 'tool_calls' if any.
                # DB currently stores `tool_call_id` but we need to reconstruct `tool_calls` list for history if we want full fidelity.
                # For simplicity now, we just pass content. 
                # Improving history fidelity is a Phase 4+ task.
                llm_messages.append({"role": msg.role, "content": content})

            
            # 4. Agent Execution Loop (Max 3 turns)
            tools = agent_service.get_tools_schema()
            turn_count = 0
            
            while turn_count < 3:
                turn_count += 1
                full_content = ""
                tool_calls = []
                
                # Stream Response
                async for chunk in llm_service.chat_stream(llm_messages, tools=tools):
                    content = chunk.get('content', '')
                    if content:
                        full_content += content
                        await websocket.send_text(content)
                    
                    if chunk.get('tool_calls'):
                        tool_calls.extend(chunk['tool_calls'])
                
                # Save Assistant Message
                async with AsyncSessionLocal() as db:
                    # If it was a tool call, content might be empty or explanatory
                    ai_msg = Message(session_id=session_id, role="assistant", content=full_content)
                    db.add(ai_msg)
                    await db.commit()
                
                llm_messages.append({"role": "assistant", "content": full_content})

                # If no tool calls, we are done
                if not tool_calls:
                    break
                
                # Execute Tools
                # Send a marker to client?
                await websocket.send_text("\n\n*Processing actions...*\n")
                
                for tool in tool_calls:
                    func_name = tool['function']['name']
                    args = tool['function']['arguments']
                    
                    # Execute
                    async with AsyncSessionLocal() as db:
                        result = await agent_service.execute_tool(func_name, args, db)
                    
                    # Add result to history
                    llm_messages.append({
                        "role": "tool",
                        "content": str(result),
                        "name": func_name
                    })
                    
                    # Save to DB
                    async with AsyncSessionLocal() as db:
                        tool_msg = Message(session_id=session_id, role="tool", content=str(result), tool_call_id=func_name)
                        db.add(tool_msg)
                        await db.commit()
                        
                    await websocket.send_text(f"\n> Action: {func_name} -> {result}\n")
                
                # Loop will run again with new history (assistant msg + tool results) to generate final response
                
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"Error in websocket: {e}")
        try:
            await websocket.close()
        except:
            pass
