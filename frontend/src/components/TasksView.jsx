import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, MessagesSquare, Trash2 } from 'lucide-react';
import TaskModal from './TaskModal';

const TasksView = ({ tasks = [], onAddTask, onUpdateTask, onDeleteTask, onOpenTaskChat }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const kanbanData = useMemo(() => {
        const columns = {
            backlog: [],
            todo: [],
            in_progress: [],
            done: []
        };

        tasks.forEach(task => {
            // Default to backlog if status processing fails matches nothing
            const status = task.status || 'todo';
            if (columns[status]) {
                columns[status].push(task);
            } else {
                columns.backlog.push(task);
            }
        });
        return columns;
    }, [tasks]);

    const openNewTaskModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const openEditTaskModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSubmit = (taskData) => {
        if (editingTask) {
            onUpdateTask(editingTask.id, taskData);
        } else {
            onAddTask(taskData);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 animate-in fade-in duration-300 overflow-hidden relative">
            <header className="border-b border-[#333] pb-6 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-[#e5e5e5] mb-2 tracking-tight">Task Board</h2>
                    <p className="text-[#888] font-mono text-sm">Kanban View</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={openNewTaskModal} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-bold uppercase rounded-sm transition-colors">
                        <Plus size={14} /> New Task
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden mt-6">
                <div className="flex h-full gap-6 min-w-[1000px]">
                    {Object.entries(kanbanData).map(([columnId, columnTasks]) => (
                        <div key={columnId} className="flex-1 flex flex-col bg-[#161616] border border-[#333] rounded-sm min-w-[280px]">
                            <div className="p-3 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                                <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">{columnId.replace('_', ' ')}</h3>
                                <span className="text-[10px] font-mono bg-[#222] text-[#666] px-1.5 py-0.5 rounded-sm">{columnTasks.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {columnTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => openEditTaskModal(task)}
                                        className="p-4 bg-[#111] border border-[#333] rounded-sm hover:border-orange-500/50 cursor-pointer group transition-colors shadow-sm relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase border tracking-wider ${task.tag === 'BUG' ? 'bg-rose-900/10 border-rose-900/30 text-rose-500' :
                                                task.tag === 'DEV' ? 'bg-blue-900/10 border-blue-900/30 text-blue-500' :
                                                    'bg-[#222] border-[#333] text-[#666]'
                                                }`}>{task.tag || 'GEN'}</span>
                                            <div className="flex gap-2">
                                                {task.priority === 'high' && <AlertTriangle size={12} className="text-orange-500" />}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onOpenTaskChat(task); }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-orange-500 transition-all"
                                                    title="Open Task Chat"
                                                >
                                                    <MessagesSquare size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-[#d4d4d4] mb-3">{task.title}</p>
                                        <div className="flex justify-between items-center pt-2 border-t border-[#222]">
                                            <span className="text-[10px] font-mono text-[#555]">{String(task.id).toUpperCase()}</span>
                                            {task.user && <div className="w-5 h-5 rounded-sm bg-[#333] flex items-center justify-center text-[9px] text-[#ccc] font-bold">{task.user}</div>}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={openNewTaskModal} className="w-full py-2 border border-dashed border-[#333] rounded-sm text-[#444] hover:text-[#888] hover:border-[#555] text-xs font-mono uppercase transition-colors">+ Add Item</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                onDelete={onDeleteTask}
                initialData={editingTask}
            />
        </div>
    );
}

export default TasksView;
