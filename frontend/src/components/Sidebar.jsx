import React from 'react';
import { LayoutDashboard, MessageSquare, CheckSquare, Settings, Folder, Cpu, ChevronRight } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
        { id: 'projects', icon: Folder, label: 'Projects' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'tasks', icon: CheckSquare, label: 'Agenda' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-16 lg:w-64 bg-[#111] border-r border-[#333] flex flex-col justify-between z-20 shrink-0 transition-all duration-300">
            <div>
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[#333]">
                    <div className="w-8 h-8 bg-orange-600 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                        <Cpu className="text-white w-5 h-5" />
                    </div>
                    <span className="hidden lg:block ml-3 font-mono font-bold text-lg text-[#e5e5e5] tracking-tight">ISHAN'S JARVIS</span>
                </div>

                <nav className="mt-6 px-0 lg:px-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start px-4 py-3 transition-all duration-200 group relative ${activeTab === item.id
                                ? 'text-orange-500 bg-[#1a1a1a]'
                                : 'text-[#666] hover:bg-[#1a1a1a] hover:text-[#ccc]'
                                }`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />
                            )}
                            <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className={`hidden lg:block ml-3 font-mono text-xs uppercase tracking-wider ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                            {activeTab === item.id && <ChevronRight className="ml-auto w-3 h-3 hidden lg:block" />}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-[#333]">
                <div className="flex items-center justify-center lg:justify-start p-2 gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                    </div>
                    <div className="hidden lg:block">
                        <div className="text-[10px] text-[#666] font-mono uppercase tracking-wider leading-none">System</div>
                        <div className="text-xs text-[#ccc] font-mono">Online</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
