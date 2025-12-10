import React, { useState, useEffect, useRef } from 'react';
import { Folder, Plus, Search, FileText, Upload, MessageSquare, ChevronLeft, MoreVertical, FileCode, Brain, ChevronRight, Trash2 } from 'lucide-react';
import { projectsApi, chatApi } from '../api/client';
import { useChat } from '../hooks/useChat';

const MessageContent = ({ content }) => {
    // Helper to render the thought block
    const ThoughtBlock = ({ thought, isOpen = false, isStreaming = false }) => (
        <details className="mb-2 group bg-[#161616] border border-[#222] rounded-sm overflow-hidden" open={isOpen}>
            <summary className="flex items-center gap-2 p-2 cursor-pointer text-xs text-[#666] hover:text-[#bbb] select-none list-none">
                <div className="group-open:rotate-90 transition-transform">
                    <ChevronRight size={12} />
                </div>
                <Brain size={12} className={isStreaming ? "text-orange-900 animate-pulse" : "text-orange-900"} />
                <span className="font-bold tracking-wider uppercase opacity-70">
                    {isStreaming ? "Thinking..." : "Thought Process"}
                </span>
            </summary>
            <div className="p-3 pt-0 text-[#555] text-xs whitespace-pre-wrap border-t border-[#222] bg-[#0f0f0f]">
                {thought}
            </div>
        </details>
    );

    // 1. Check for standard or partial <think> tags
    const hasOpening = content.includes('<think>');
    const hasClosing = content.includes('</think>');

    // Case A: Standard <think>...</think> block (or multiple)
    if (hasOpening) {
        const parts = content.split(/(<think>[\s\S]*?<\/think>)/g);
        return (
            <div className="font-mono text-sm leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('<think>')) {
                        if (part.endsWith('</think>')) {
                            // Complete block
                            const thought = part.replace(/<\/?think>/g, '').trim();
                            return <ThoughtBlock key={i} thought={thought} />;
                        } else {
                            // Incomplete block (streaming at the end)
                            const thought = part.replace('<think>', '');
                            return <ThoughtBlock key={i} thought={thought} isOpen={true} isStreaming={true} />;
                        }
                    }
                    if (!part.trim()) return null;
                    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
                })}
            </div>
        );
    }

    // Case B: Missing opening tag but has closing tag
    if (!hasOpening && hasClosing) {
        const [thought, ...rest] = content.split('</think>');
        const finalRest = rest.join('</think>').trim();
        return (
            <div className="font-mono text-sm leading-relaxed">
                <ThoughtBlock thought={thought.trim()} />
                <div className="whitespace-pre-wrap">{finalRest}</div>
            </div>
        );
    }

    // Case C: No tags - Regular text
    return <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">{content}</div>;
};

const ProjectDetailView = ({ project, onBack }) => {
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const { messages, sendMessage, status } = useChat(sessionId);

    useEffect(() => {
        loadFiles();
        loadProjectSessions();
    }, [project.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadProjectSessions = async () => {
        try {
            const res = await chatApi.getSessions();
            // Filter sessions for this specific project
            const projectSessions = res.data.filter(session =>
                session.title === `Project: ${project.name}`
            );
            setSessions(projectSessions);

            // If there are existing sessions, use the most recent one
            if (projectSessions.length > 0) {
                setSessionId(projectSessions[0].id);
            } else {
                // Create initial session if none exist
                await createNewChat();
            }
        } catch (err) {
            console.error("Failed to load project sessions:", err);
        }
    };

    const createNewChat = async () => {
        try {
            const res = await chatApi.createSession(`Project: ${project.name}`);
            setSessions([res.data, ...sessions]);
            setSessionId(res.data.id);
        } catch (err) {
            console.error("Failed to create chat session:", err);
        }
    };

    const handleDeleteSession = async (id) => {
        try {
            await chatApi.deleteSession(id);
            const updatedSessions = sessions.filter(s => s.id !== id);
            setSessions(updatedSessions);
            if (sessionId === id) {
                // Switch to another session or create a new one
                if (updatedSessions.length > 0) {
                    setSessionId(updatedSessions[0].id);
                } else {
                    await createNewChat();
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadFiles = async () => {
        try {
            const res = await projectsApi.getFiles(project.id);
            setFiles(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const res = await projectsApi.uploadFile(project.id, file);
            setFiles([...files, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = () => {
        if (!input.trim() || !sessionId) return;
        sendMessage(input);
        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
            <header className="border-b border-[#333] p-6 bg-[#0d0d0d]/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-[#222] rounded-full text-[#666] hover:text-[#e5e5e5] transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-[#e5e5e5] tracking-tight">{project.name}</h2>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm uppercase border tracking-wider ${project.status === 'active' ? 'bg-emerald-900/10 border-emerald-900/30 text-emerald-500' :
                                'bg-[#222] border-[#333] text-[#666]'
                                }`}>{project.status}</span>
                        </div>
                        <p className="text-[#666] font-mono text-xs max-w-xl truncate">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-[#222] rounded-sm text-[#666] hover:text-[#e5e5e5]">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chat History */}
                <div className="w-64 border-r border-[#333] flex flex-col bg-[#111]">
                    <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#161616]">
                        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Chat History</h3>
                        <button
                            onClick={createNewChat}
                            className="text-[10px] bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded-sm text-white border border-orange-600 transition-colors uppercase font-mono">
                            + New
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => setSessionId(session.id)}
                                className={`group p-3 rounded-sm cursor-pointer border transition-all ${sessionId === session.id
                                    ? 'bg-[#1f1f1f] border-orange-500/50'
                                    : 'bg-transparent border-transparent hover:bg-[#1a1a1a] hover:border-[#333]'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-mono ${sessionId === session.id ? 'text-orange-500' : 'text-[#666]'}`}>#{session.id}</span>
                                    <span className="text-[9px] text-[#555]">{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className={`text-xs truncate ${sessionId === session.id ? 'text-[#e5e5e5]' : 'text-[#888]'}`}>
                                    Chat Session
                                </div>
                            </div>
                        ))}
                    </div>
                    {sessionId && (
                        <div className="p-3 border-t border-[#333] bg-[#161616]">
                            <button
                                onClick={() => handleDeleteSession(sessionId)}
                                className="w-full flex items-center justify-center gap-2 py-2 text-[#666] hover:text-red-400 hover:bg-[#222] rounded-sm transition-colors text-xs font-mono uppercase tracking-wide">
                                <Trash2 size={12} /> Clear Current
                            </button>
                        </div>
                    )}
                </div>

                {/* Middle: Files & Context */}
                <div className="w-64 border-r border-[#333] flex flex-col bg-[#111]">
                    <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#161616]">
                        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-2">
                            <FileCode size={14} className="text-orange-500" /> Files
                        </h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] bg-[#222] hover:bg-[#333] px-2 py-1 rounded-sm text-[#ccc] border border-[#333] transition-colors uppercase font-mono">
                            + Add
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingFiles ? (
                            <div className="p-4 text-xs text-[#666] font-mono text-center">Loading files...</div>
                        ) : files.length === 0 ? (
                            <div className="p-4 text-xs text-[#666] font-mono text-center">No files yet.</div>
                        ) : (
                            files.map(file => (
                                <div key={file.id} className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded-sm cursor-pointer text-[#888] hover:text-[#e5e5e5] font-mono text-xs transition-colors group">
                                    <FileText size={12} className="group-hover:text-orange-500 transition-colors" />
                                    {file.filename}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Project Chat / Context */}
                <div className="flex-1 flex flex-col bg-[#0d0d0d] relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <Folder size={200} />
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex gap-4 max-w-3xl">
                                <div className="w-8 h-8 rounded-sm bg-orange-600 flex items-center justify-center shrink-0 font-bold text-white text-xs">AI</div>
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-orange-500 font-bold text-xs font-mono">SYSTEM</span>
                                        <span className="text-[#444] text-[10px] font-mono">Just now</span>
                                    </div>
                                    <p className="text-[#ccc] text-sm leading-relaxed bg-[#161616] p-3 rounded-sm border border-[#333]">
                                        Project context initialized. I have access to the codebase for <span className="text-orange-500">{project.name}</span>. How can I assist you with this project today?
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 font-bold text-xs ${
                                        msg.role === 'user' ? 'bg-[#333] text-[#888]' : 'bg-orange-600 text-white'
                                    }`}>
                                        {msg.role === 'user' ? 'ME' : 'AI'}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className={`flex items-baseline gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <span className={`font-bold text-xs font-mono ${msg.role === 'user' ? 'text-[#888]' : 'text-orange-500'}`}>
                                                {msg.role === 'user' ? 'YOU' : 'ASSISTANT'}
                                            </span>
                                            <span className="text-[#444] text-[10px] font-mono">
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                            </span>
                                        </div>
                                        <div className={`text-[#ccc] text-sm leading-relaxed p-3 rounded-sm border ${
                                            msg.role === 'user' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#161616] border-[#333]'
                                        }`}>
                                            <MessageContent content={msg.content} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-[#333] bg-[#111]">
                        <div className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={!sessionId || status !== 'connected'}
                                className="w-full bg-[#161616] border border-[#333] p-3 pl-4 pr-12 rounded-sm text-sm text-[#e5e5e5] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono placeholder-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={sessionId ? `Message ${project.name} context...` : "Initializing chat..."}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || !sessionId || status !== 'connected'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-600"
                            >
                                <MessageSquare size={14} />
                            </button>
                        </div>
                        {status !== 'connected' && sessionId && (
                            <div className="mt-2 text-xs text-[#666] font-mono text-center">
                                {status === 'connecting' ? 'Connecting to chat...' : 'Disconnected'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectsView = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // New Project State
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const res = await projectsApi.getAll();
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await projectsApi.create({
                name: newProjectName,
                description: newProjectDesc,
                status: 'active'
            });
            setProjects([...projects, res.data]);
            setShowNewModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
        } catch (err) {
            console.error(err);
        }
    };

    if (selectedProject) {
        return <ProjectDetailView project={selectedProject} onBack={() => setSelectedProject(null)} />;
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-1">Projects</h2>
                    <p className="text-[#666] font-mono text-xs">Manage active development workspaces</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={14} />
                        <input className="pl-9 pr-4 py-2 bg-[#161616] border border-[#333] rounded-sm text-sm text-[#ccc] focus:border-orange-500/50 w-64 placeholder-[#444] font-mono" placeholder="Search projects..." />
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        <Plus size={14} /> New Project
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="bg-[#161616] border border-[#333] hover:border-orange-500/30 rounded-sm p-5 cursor-pointer group transition-all relative overflow-hidden flex flex-col h-64">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-[#222] rounded-sm border border-[#333] group-hover:border-orange-500/30 transition-colors">
                                <Folder className="text-orange-500" size={20} />
                            </div>
                            <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-sm border ${project.status === 'active' ? 'text-emerald-400 bg-emerald-900/10 border-emerald-900/30' : 'text-[#666] bg-[#222] border-[#333]'}`}>
                                {project.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#e5e5e5] mb-2 group-hover:text-orange-500 transition-colors">{project.name}</h3>
                        <p className="text-[#888] text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{project.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[#222]">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-xs text-[#666] font-mono">
                                    <FileText size={12} /> {project.file_count || 0} Files
                                </span>
                            </div>
                            <span className="text-[10px] text-[#444] font-mono">{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showNewModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161616] border border-[#333] rounded-sm w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-[#e5e5e5] mb-4">New Project</h3>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-[#666] mb-1.5">Name</label>
                                <input
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] p-2 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-[#666] mb-1.5">Description</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={e => setNewProjectDesc(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] p-2 text-sm text-[#e5e5e5] focus:border-orange-500 rounded-sm h-24"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-xs font-mono text-[#888] hover:text-[#e5e5e5]">CANCEL</button>
                                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-sm text-xs font-mono font-bold">CREATE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsView;
