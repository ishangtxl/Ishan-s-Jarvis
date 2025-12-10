import React, { useState } from 'react';
import { CheckSquare, MessagesSquare, Trash2, Check, Edit3 } from 'lucide-react';
import TaskModal from './TaskModal';

const TodoListWidget = ({ tasks = [], onToggleStatus, onAddTask, onUpdateTask, onDeleteTask, onOpenTaskChat }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');

    const handleOpenAdd = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSubmit = (taskData) => {
        if (editingTask) {
            onUpdateTask(editingTask.id, taskData);
        } else {
            onAddTask({
                ...taskData,
                status: 'todo'
            });
        }
    };

    return (
        <div className="bg-[#161616] border border-[#333] rounded-sm h-full flex flex-col shadow-lg">
            <div className="px-5 py-4 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                    My Tasks
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#666] bg-[#222] px-1.5 py-0.5 rounded-sm border border-[#333]">{pendingTasks.length} PENDING</span>
                    <button
                        onClick={handleOpenAdd}
                        className="w-6 h-6 bg-[#222] hover:bg-[#333] border border-[#333] hover:border-[#555] rounded-sm flex items-center justify-center text-[#888] hover:text-[#e5e5e5] transition-all"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">

                {/* Pending Tasks */}
                {pendingTasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => handleOpenEdit(task)}
                        className="group flex items-start gap-3 p-3 hover:bg-[#1a1a1a] rounded-sm cursor-pointer transition-colors border border-transparent hover:border-[#333] relative"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleStatus(task, 'done'); }}
                            className="mt-0.5 w-4 h-4 border border-[#444] rounded-sm flex items-center justify-center transition-colors group-hover:border-orange-500 bg-[#111]"
                        >
                        </button>
                        <div className="flex-1 min-w-0 pr-16">
                            <div className="text-sm font-medium truncate text-[#d4d4d4]">{task.title}</div>
                            {task.description && <div className="text-[10px] text-[#666] truncate mt-0.5">{task.description}</div>}
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase border tracking-wider ${task.priority === 'high' ? 'text-rose-400 border-rose-900/30 bg-rose-900/10' :
                                    task.priority === 'med' ? 'text-amber-400 border-amber-900/30 bg-amber-900/10' :
                                        'text-[#666] border-[#333] bg-[#222]'
                                    }`}>
                                    {task.priority || 'MED'}
                                </span>
                                {task.tag && <span className="text-[9px] font-mono text-[#555] px-1.5 py-0.5 rounded-sm border border-[#333] uppercase">{task.tag}</span>}
                                {task.deadline && <span className="text-[9px] font-mono text-[#555] ml-auto">{new Date(task.deadline).toLocaleDateString()}</span>}
                            </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a]/80 backdrop-blur-sm pl-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(task); }}
                                className="text-[#555] hover:text-[#ddd] transition-colors p-1.5 hover:bg-[#222] rounded-sm"
                            >
                                <Edit3 size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenTaskChat(task); }}
                                className="text-[#555] hover:text-orange-500 transition-colors p-1.5 hover:bg-[#222] rounded-sm"
                                title="Open Task Chat"
                            >
                                <MessagesSquare size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div className="px-3 py-2 text-[10px] font-mono text-[#555] uppercase tracking-wider border-t border-[#222] mt-4 mb-1">Completed</div>
                )}

                {completedTasks.map(task => (
                    <div key={task.id} className="group flex items-start gap-3 p-3 hover:bg-[#1a1a1a] rounded-sm cursor-pointer transition-colors opacity-60">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleStatus(task, 'todo'); }}
                            className="mt-0.5 w-4 h-4 border border-emerald-500 bg-emerald-900/20 rounded-sm flex items-center justify-center transition-colors"
                        >
                            <Check size={10} className="text-emerald-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-[#555] line-through">{task.title}</div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                            className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-500 transition-all p-1"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                onDelete={onDeleteTask}
                initialData={editingTask}
            />
        </div>
    )
}

export default TodoListWidget;
