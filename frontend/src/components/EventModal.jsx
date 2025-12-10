import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlignLeft } from 'lucide-react';

const EventModal = ({ isOpen, onClose, onSubmit, onDelete, initialData, selectedDate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [type, setType] = useState('meeting');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setDate(initialData.date);
            setTime(initialData.time || '09:00');
            setType(initialData.type || 'meeting');
        } else if (selectedDate) {
            // selectedDate is expected to be a day number or full date string
            // For simplicity, assuming it's day number for this month in 2025 as per mock
            // But ideally it should be a full date YYYY-MM-DD
            // For now, let's just pre-fill if it's a valid date string
            if (typeof selectedDate === 'string' && selectedDate.includes('-')) {
                setDate(selectedDate);
            }
        } else {
            resetForm();
        }
    }, [initialData, selectedDate, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDate('');
        setTime('09:00');
        setType('meeting');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            date,
            time,
            type
        });
        onClose();
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] border border-[#333] rounded-sm w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={16} className="text-orange-500" />
                        {initialData ? 'Edit Event' : 'New Event'}
                    </h2>
                    <button onClick={onClose} className="text-[#666] hover:text-[#e5e5e5] transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-mono text-[#666] mb-1.5 uppercase tracking-wider">Event Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] p-2.5 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm transition-colors placeholder-[#444]"
                            placeholder="e.g. System Architecture Review"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-[#666] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#111] border border-[#333] p-2.5 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#666] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} /> Time
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-[#111] border border-[#333] p-2.5 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-[#666] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag size={12} /> Type
                        </label>
                        <div className="flex bg-[#111] p-1 border border-[#333] rounded-sm">
                            {['meeting', 'deadline', 'review', 'other'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 text-[10px] uppercase font-mono py-1.5 rounded-sm transition-colors ${type === t ? 'bg-[#333] text-orange-500 font-bold shadow-sm' : 'text-[#666] hover:text-[#ccc]'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-[#666] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <AlignLeft size={12} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] p-2.5 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm h-24 resize-none placeholder-[#444]"
                            placeholder="Add details about this event..."
                        />
                    </div>
                </form>

                <div className="p-4 border-t border-[#333] bg-[#1a1a1a] flex justify-end gap-3">
                    {initialData && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="mr-auto text-rose-500 hover:text-rose-400 text-xs font-mono font-bold uppercase"
                        >
                            Delete Event
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-mono text-[#888] hover:text-[#e5e5e5] uppercase transition-colors">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-sm text-xs font-mono font-bold uppercase shadow-lg transition-colors">
                        {initialData ? 'Save Changes' : 'Create Event'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
