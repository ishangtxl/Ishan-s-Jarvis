import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, Tag, Save } from 'lucide-react';
import { memoryApi } from '../api/client';

const MemoryModal = ({ onClose }) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            const res = await memoryApi.getAll();
            setMemories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        try {
            const res = await memoryApi.create(newContent, newCategory);
            setMemories([res.data, ...memories]);
            setNewContent('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            setMemories(memories.filter(m => m.id !== id));
            await memoryApi.delete(id);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] border border-[#333] rounded-sm w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider flex items-center gap-2">
                        <Brain size={16} className="text-orange-500" />
                        CORE MEMORY
                    </h2>
                    <button onClick={onClose} className="text-[#666] hover:text-[#e5e5e5] transition-colors"><X size={18} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Input Section */}
                    <div className="w-1/3 border-r border-[#333] p-4 bg-[#111] flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-2">New Memory</label>
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full bg-[#161616] border border-[#333] focus:border-orange-500 rounded-sm p-3 text-xs text-[#e5e5e5] placeholder-[#444] resize-none h-32 font-mono scrollbar-hide"
                                placeholder="e.g. User prefers concise python code..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-2">Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['general', 'personal', 'work', 'preferences'].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setNewCategory(cat)}
                                        className={`px-2 py-1.5 rounded-sm text-[10px] font-mono uppercase border transition-colors ${newCategory === cat
                                                ? 'bg-orange-900/20 border-orange-500 text-orange-500'
                                                : 'bg-[#1a1a1a] border-[#333] text-[#666] hover:border-[#555]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!newContent.trim()}
                            className="mt-auto w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add to Core
                        </button>
                    </div>

                    {/* List Section */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-[#444] font-mono text-xs">Loading neural pathways...</div>
                        ) : memories.length === 0 ? (
                            <div className="text-center py-10 text-[#444] font-mono text-xs">No core memories established.</div>
                        ) : (
                            memories.map(memory => (
                                <div key={memory.id} className="bg-[#111] border border-[#333] rounded-sm p-3 group hover:border-[#444] transition-colors relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase border tracking-wider ${memory.category === 'personal' ? 'bg-purple-900/10 border-purple-900/30 text-purple-500' :
                                                memory.category === 'work' ? 'bg-blue-900/10 border-blue-900/30 text-blue-500' :
                                                    'bg-[#1a1a1a] border-[#333] text-[#666]'
                                            }`}>
                                            {memory.category}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(memory.id)}
                                            className="text-[#444] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-[#ccc] font-mono leading-relaxed">
                                        {memory.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoryModal;
