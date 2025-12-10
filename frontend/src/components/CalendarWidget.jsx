import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getDate, getDay, startOfMonth } from 'date-fns';

const CalendarWidget = ({ events = [], onDayClick }) => {
    const today = new Date();
    const headers = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Simple calendar logic (fixed to current month for demo, ideally dynamic)
    const currentMonth = today;
    const startDay = getDay(startOfMonth(currentMonth));
    const totalDays = 31; // Dec has 31

    const renderCalendarDays = () => {
        const cells = [];
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-[#111] border-r border-b border-[#333] min-h-[100px]" />);
        }
        for (let d = 1; d <= totalDays; d++) {
            // Filter events for this day
            const dayEvents = events.filter(e => {
                const eventDate = new Date(e.start_time);
                return getDate(eventDate) === d;
            });

            const isToday = getDate(today) === d;

            cells.push(
                <div
                    key={d}
                    onClick={() => onDayClick && onDayClick(d)}
                    className={`bg-[#111] border-r border-b border-[#333] min-h-[100px] p-2 relative group hover:bg-[#1a1a1a] cursor-pointer transition-colors ${isToday ? 'bg-[#181818]' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`font-mono text-sm block mb-1 ${isToday ? 'text-orange-500 font-bold' : 'text-[#555]'}`}>
                            {d < 10 ? `0${d}` : d}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-orange-500 font-bold transition-opacity">+</span>
                    </div>
                    <div className="space-y-1">
                        {dayEvents.map((ev, idx) => (
                            <div key={ev.id || idx} className="flex items-center gap-1.5 text-[9px] font-mono px-1.5 py-1 rounded-sm bg-[#222] border border-[#333] text-[#ccc] truncate border-l-2 border-l-orange-500 shadow-sm">
                                <span className="opacity-60">{ev.start_time ? format(new Date(ev.start_time), 'HH:mm') : ''}</span>
                                <span className="truncate">{ev.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="bg-[#161616] border border-[#333] rounded-sm flex flex-col h-full shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#1a1a1a]">
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Calendar // {format(today, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-[#333] rounded-sm text-[#666] hover:text-[#ccc] transition-colors"><ChevronLeft size={16} /></button>
                    <button className="p-1.5 hover:bg-[#333] rounded-sm text-[#666] hover:text-[#ccc] transition-colors"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 border-b border-[#333] bg-[#161616]">
                {headers.map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-mono font-bold text-[#666] border-r border-[#333] last:border-r-0 tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-[#111]">
                {renderCalendarDays()}
            </div>
        </div>
    );
}

export default CalendarWidget;
