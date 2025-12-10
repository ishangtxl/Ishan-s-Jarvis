import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ProjectsView from './components/ProjectsView';
import CalendarWidget from './components/CalendarWidget';
import TodoListWidget from './components/TodoListWidget';
import EventModal from './components/EventModal';
import MemoryModal from './components/MemoryModal';
import { tasksApi } from './api/client';
import { Clock, Brain, Search, Mic, Bell } from 'lucide-react';
import TasksView from './components/TasksView';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Event Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isMemoryOpen, setIsMemoryOpen] = useState(false);

    useEffect(() => {
        fetchData();
        // Poll for updates (e.g. from Agent actions) every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, eventsRes] = await Promise.all([
                tasksApi.getAll(),
                tasksApi.getEvents()
            ]);
            // Compare stringified data to avoid unnecessary re-renders if possible, 
            // but for now simple set is fine as React handles diffing.
            setTasks(tasksRes.data);
            setEvents(eventsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const handleAddTask = async (taskData) => {
        try {
            const res = await tasksApi.create(taskData);
            setTasks([...tasks, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTask = async (id, taskData) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...taskData } : t));
            await tasksApi.update(id, taskData);
            fetchData(); // Sync to be sure
        } catch (err) {
            console.error(err);
            fetchData();
        }
    };

    const handleToggleStatus = async (task, status) => {
        try {
            const updatedTask = { ...task, status };
            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));

            await tasksApi.update(task.id, { status });
        } catch (err) {
            console.error(err);
            fetchData(); // revert on error
        }
    };

    const handleDeleteTask = async (task) => {
        try {
            setTasks(tasks.filter(t => t.id !== task.id));
            await tasksApi.delete(task.id);
        } catch (err) {
            console.error(err);
            fetchData();
        }
    };

    // Event Handlers
    const handleDayClick = (day) => {
        const dateStr = `2025-12-${day < 10 ? '0' + day : day}`;
        setSelectedDate(dateStr);
        setIsEventModalOpen(true);
    };

    const handleCreateEvent = async (eventData) => {
        try {
            const res = await tasksApi.createEvent(eventData);
            setEvents([...events, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            setEvents(events.filter(e => e.id !== eventId));
            await tasksApi.deleteEvent(eventId);
        } catch (err) {
            console.error(err);
            fetchData();
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="h-[calc(100vh-4rem)] p-6 overflow-y-auto custom-scrollbar">
                        {/* Time Display */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-[#e5e5e5] tracking-tight">Home</h2>
                            <div className="text-right">
                                <div className="text-6xl font-bold text-[#e5e5e5] font-mono tracking-tight">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                                <div className="text-sm font-mono text-orange-500 tracking-wider mt-1">
                                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} • {currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Widgets Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[600px]">
                            <div className="lg:col-span-2 xl:col-span-3 h-full">
                                <CalendarWidget
                                    events={events}
                                    onDayClick={handleDayClick}
                                />
                            </div>
                            <div className="h-full">
                                <TodoListWidget
                                    tasks={tasks}
                                    onAddTask={handleAddTask}
                                    onUpdateTask={handleUpdateTask}
                                    onToggleStatus={handleToggleStatus}
                                    onDeleteTask={handleDeleteTask}
                                    onOpenTaskChat={(t) => console.log('Open chat for', t)}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'projects':
                return <ProjectsView />;
            case 'chat':
                return <ChatView />;
            case 'tasks':
                return (
                    <TasksView
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onOpenTaskChat={(t) => console.log('Open chat for', t)}
                    />
                );
            case 'settings':
                return <div className="p-10 text-[#666] font-mono text-center">Settings module not initialized.</div>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-[#0d0d0d] text-[#e5e5e5] font-sans selection:bg-orange-500/30">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d] relative overflow-hidden">
                {/* Top Header/Status Bar could go here */}
                {/* Header */}
                <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-6 bg-[#0d0d0d]/50 backdrop-blur-sm z-10 sticky top-0 shrink-0">
                    <div className="flex items-center flex-1 max-w-xl">
                        {/* Search / Command Palette Placeholder */}
                        <div className="text-xs font-mono text-[#444]">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                        <button
                            onClick={() => setIsMemoryOpen(true)}
                            className="flex items-center gap-2 px-3 py-1 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-600/30 rounded-sm transition-all text-xs font-mono font-bold uppercase"
                        >
                            <Brain size={14} /> <span className="hidden md:inline">Memory</span>
                        </button>
                        <div className="h-4 w-px bg-[#333]"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                            <div className="text-[10px] font-mono text-[#444] uppercase hidden sm:block">Env: Production</div>
                        </div>
                    </div>
                </header>

                {renderContent()}
            </main>

            {isMemoryOpen && <MemoryModal onClose={() => setIsMemoryOpen(false)} />}

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSubmit={handleCreateEvent}
                onDelete={handleDeleteEvent}
                selectedDate={selectedDate}
            />
        </div>
    );
}

export default App;