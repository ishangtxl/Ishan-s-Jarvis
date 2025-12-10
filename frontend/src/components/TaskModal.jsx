import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, AlignLeft } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, onSubmit, onDelete, initialData = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('med');
    const [deadline, setDeadline] = useState('');
    const [tag, setTag] = useState('GEN');

    const [status, setStatus] = useState('todo');
    const [user, setUser] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setPriority(initialData.priority || 'med');
            setDeadline(initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : '');
            setTag(initialData.tag || 'GEN');
            setStatus(initialData.status || 'todo');
            setUser(initialData.user || '');
        } else if (isOpen) {
            // Reset for new task
            setTitle('');
            setDescription('');
            setPriority('med');
            setDeadline('');
            setTag('GEN');
            setStatus('todo');
            setUser('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            priority,
            deadline: deadline || null,
            tag,
            status,
            user
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#121212] border border-[#333] w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a] rounded-t-lg">
                    <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">
                        {initialData ? 'Edit Task' : 'New Task'}
                    </h3>
                    <button onClick={onClose} className="text-[#666] hover:text-[#e5e5e5] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5">Title</label>
                        <input
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2.5 text-sm text-[#e5e5e5] focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all placeholder-[#444]"
                            placeholder="What needs to be done?"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2 text-xs text-[#ccc] appearance-none"
                            >
                                <option value="backlog">Backlog</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5">Assignee</label>
                            <input
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2 text-xs text-[#e5e5e5] focus:border-orange-500/50 outline-none uppercase font-mono placeholder-[#444]"
                                placeholder="INIT"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5 flex items-center gap-2">
                            <AlignLeft size={12} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2.5 text-xs text-[#ccc] focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all custom-scrollbar placeholder-[#444]"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5 flex items-center gap-2">
                                <Flag size={12} /> Priority
                            </label>
                            <div className="grid grid-cols-3 gap-1 bg-[#0a0a0a] p-1 rounded-sm border border-[#333]">
                                {['low', 'med', 'high'].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`text-[10px] font-mono uppercase py-1.5 rounded-sm transition-all ${priority === p
                                            ? p === 'high' ? 'bg-rose-900/40 text-rose-400 border border-rose-900/50'
                                                : p === 'med' ? 'bg-amber-900/40 text-amber-400 border border-amber-900/50'
                                                    : 'bg-emerald-900/40 text-emerald-400 border border-emerald-900/50'
                                            : 'text-[#555] hover:text-[#999]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tag */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5 flex items-center gap-2">
                                <Tag size={12} /> Tag
                            </label>
                            <input
                                value={tag}
                                onChange={(e) => setTag(e.target.value.toUpperCase())}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2 text-xs text-[#e5e5e5] focus:border-orange-500/50 outline-none uppercase font-mono placeholder-[#444]"
                                placeholder="GEN"
                                maxLength={4}
                            />
                        </div>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase text-[#666] mb-1.5 flex items-center gap-2">
                            <Calendar size={12} /> Deadline
                        </label>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-sm p-2 text-xs text-[#e5e5e5] focus:border-orange-500/50 outline-none font-mono"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-between border-t border-[#333] mt-2">
                        {initialData ? (
                            <button
                                type="button"
                                onClick={() => { onDelete(initialData); onClose(); }}
                                className="text-xs text-red-500 hover:text-red-400 font-mono uppercase hover:underline"
                            >
                                Delete
                            </button>
                        ) : <span></span>}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-mono uppercase text-[#666] hover:text-[#ccc] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all shadow-lg hover:shadow-orange-900/20"
                            >
                                {initialData ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
