from typing import List, Dict, Any
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.task import Task, CalendarEvent

class AgentService:
    def get_tools_schema(self) -> List[Dict[str, Any]]:
        return [
            {
                'type': 'function',
                'function': {
                    'name': 'create_task',
                    'description': 'Create a new task in the Kanban board',
                    'parameters': {
                        'type': 'object',
                        'properties': {
                            'title': {'type': 'string', 'description': 'Title of the task'},
                            'priority': {'type': 'string', 'enum': ['low', 'med', 'high'], 'description': 'Priority level'},
                            'tag': {'type': 'string', 'description': 'Tag like DEV, BUG, GEN'},
                            'description': {'type': 'string', 'description': 'Detailed description'}
                        },
                        'required': ['title']
                    }
                }
            },
            {
                'type': 'function',
                'function': {
                    'name': 'create_calendar_event',
                    'description': 'Schedule a new event on the calendar',
                    'parameters': {
                        'type': 'object',
                        'properties': {
                            'title': {'type': 'string', 'description': 'Event title'},
                            'start_time': {'type': 'string', 'description': 'Start time in ISO format (YYYY-MM-DDTHH:MM:SS)'},
                            'end_time': {'type': 'string', 'description': 'End time in ISO format'},
                            'description': {'type': 'string', 'description': 'Event details'}
                        },
                        'required': ['title', 'start_time', 'end_time']
                    }
                }
            }
        ]

    async def execute_tool(self, name: str, args: Dict[str, Any], db: AsyncSession) -> str:
        try:
            if name == 'create_task':
                return await self._create_task(args, db)
            elif name == 'create_calendar_event':
                return await self._create_calendar_event(args, db)
            else:
                return f"Error: Tool {name} not found"
        except Exception as e:
            return f"Error executing tool {name}: {str(e)}"

    async def _create_task(self, args: Dict[str, Any], db: AsyncSession) -> str:
        task = Task(
            title=args.get('title'),
            priority=args.get('priority', 'med'),
            tag=args.get('tag', 'GEN'),
            description=args.get('description'),
            status='todo'
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return f"Task created successfully: ID {task.id} - {task.title}"

    async def _create_calendar_event(self, args: Dict[str, Any], db: AsyncSession) -> str:
        try:
            start = datetime.fromisoformat(args.get('start_time'))
            end = datetime.fromisoformat(args.get('end_time'))
        except ValueError:
            return "Error: Invalid date format. Use ISO format."

        event = CalendarEvent(
            title=args.get('title'),
            start_time=start,
            end_time=end,
            description=args.get('description')
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return f"Event scheduled: {event.title} from {start} to {end}"

agent_service = AgentService()
