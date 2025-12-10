import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, MessageSquare, MoreHorizontal, Cpu, Bot, Terminal,
    Mic, ArrowRight, FileText, Hash, Brain, ChevronRight
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { chatApi } from '../api/client';

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
        // Handle streaming case where <think> exists but no </think> yet (it will be in the last part)
        return (
            <div className="font-mono text-sm leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('<think>')) {
                        if (part.endsWith('</think>')) {
                            // Complete block
                            const thought = part.replace(/<\/?think>/g, '').trim();
                            return <ThoughtBlock key={i} thought={thought} />;
                        } else {
                            // Incompete block (streaming at the end)
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

    // Case B: Missing opening tag but has closing tag (The reported bug)
    // We assume everything before </think> is thought.
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

const ChatView = () => {
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const { messages, sendMessage, status } = useChat(activeSessionId);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(scrollToBottom, [messages]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await chatApi.getSessions();
            // Filter out project chats (they appear in project views only)
            const generalSessions = res.data.filter(session => !session.title.startsWith('Project:'));
            setSessions(generalSessions);
            if (generalSessions.length > 0 && !activeSessionId) {
                setActiveSessionId(generalSessions[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSession = async () => {
        try {
            const res = await chatApi.createSession("New Chat");
            setSessions([res.data, ...sessions]);
            setActiveSessionId(res.data.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSession = async (id) => {
        try {
            await chatApi.deleteSession(id);
            setSessions(sessions.filter(s => s.id !== id));
            if (activeSessionId === id) {
                setActiveSessionId(null);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                // Create file from blob
                const file = new File([audioBlob], "recording.wav", { type: "audio/wav" });

                setIsTranscribing(true);
                try {
                    const res = await chatApi.transcribe(file);
                    setInput(prev => (prev ? prev + " " + res.data.text : res.data.text));
                } catch (err) {
                    console.error("Transcription failed", err);
                    alert("Transcription failed. See console.");
                } finally {
                    setIsTranscribing(false);
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-4 lg:gap-6 p-4 lg:p-6">

            {/* --- History Sidebar --- */}
            <div className="w-64 hidden xl:flex flex-col bg-[#161616] border border-[#333] rounded-sm shadow-xl">
                <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#1a1a1a]">
                    <span className="font-mono font-bold text-[#888] text-xs uppercase tracking-wider">History</span>
                    <button onClick={handleCreateSession} className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-sm transition-colors" title="New Session">
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={`group p-3 rounded-sm cursor-pointer border transition-all ${activeSessionId === session.id
                                ? 'bg-[#1f1f1f] border-orange-500/50'
                                : 'bg-transparent border-transparent hover:bg-[#1a1a1a] hover:border-[#333]'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-mono ${activeSessionId === session.id ? 'text-orange-500' : 'text-[#666]'}`}>#{session.id}</span>
                                <span className="text-[9px] text-[#555]">{new Date(session.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={`text-sm font-medium truncate mb-1 ${activeSessionId === session.id ? 'text-[#e5e5e5]' : 'text-[#ccc]'}`}>{session.title}</div>
                        </div>
                    ))}
                </div>
                {activeSessionId && (
                    <div className="p-3 border-t border-[#333] bg-[#1a1a1a]">
                        <button onClick={() => handleDeleteSession(activeSessionId)} className="w-full flex items-center justify-center gap-2 py-2 text-[#666] hover:text-red-400 hover:bg-[#222] rounded-sm transition-colors text-xs font-mono uppercase tracking-wide">
                            <Trash2 size={12} /> Clear Current
                        </button>
                    </div>
                )}
            </div>

            {/* --- Main Chat Area --- */}
            <div className="flex-1 flex flex-col bg-[#161616] border border-[#333] rounded-sm overflow-hidden relative shadow-2xl min-w-0">
                <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-[#222] rounded-sm border border-[#333]">
                            <MessageSquare size={14} className="text-orange-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-mono font-bold text-[#e5e5e5] text-xs tracking-wider">
                                {activeSessionId ? `Chat #${activeSessionId}` : 'No Session Selected'}
                            </span>
                            <span className="text-[9px] text-[#666] font-mono">{status === 'connected' ? 'Secure Connection' : status}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === 'connected' && (
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-[#111] rounded-sm border border-[#333]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-mono text-[#666]">LIVE</span>
                            </div>
                        )}
                        <button className="text-[#666] hover:text-[#ccc]"><MoreHorizontal size={16} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-[#444] space-y-4">
                            <Cpu size={48} strokeWidth={1} />
                            <p className="font-mono text-sm">Start New Chat</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-start gap-3 max-w-[90%] lg:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-6 h-6 rounded-sm flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-[#333]' : msg.role === 'tool' ? 'bg-[#222] border border-[#333]' : 'bg-orange-600'}`}>
                                    {msg.role === 'user' ? <div className="text-[10px] font-bold text-[#888]">ME</div> : msg.role === 'tool' ? <Bot size={12} className="text-orange-500" /> : <Cpu size={12} className="text-white" />}
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    {msg.role === 'tool' ? (
                                        <div className="p-3 rounded-sm border bg-[#111] border-[#333] text-[#888] font-mono text-xs w-full min-w-[300px]">
                                            <div className="flex items-center gap-2 mb-2 border-b border-[#222] pb-1 text-orange-500">
                                                <Terminal size={12} />
                                                <span className="uppercase font-bold tracking-wider">Action ({msg.tool_call_id})</span>
                                            </div>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                    ) : (
                                        <div className={`p-3 rounded-sm border ${msg.role === 'user' ? 'bg-[#1f1f1f] border-[#333] text-[#d4d4d4]' : 'bg-[#111] border-[#333] text-[#a3a3a3]'}`}>
                                            <MessageContent content={msg.content} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`text-[9px] font-mono text-[#444] mt-1 ${msg.role === 'user' ? 'mr-10' : 'ml-10'}`}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                        </div>
                    ))}
                    {status === 'connecting' && <div className="text-xs text-[#555] font-mono ml-10">Connecting...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-[#1a1a1a] border-t border-[#333]">
                    <div className="relative flex items-center bg-[#111] border border-[#333] focus-within:border-orange-500/50 transition-colors rounded-sm px-2">
                        <button
                            onClick={handleMicClick}
                            disabled={isTranscribing}
                            className={`p-2 transition-colors tooltip rounded-sm ${isRecording
                                ? 'text-white bg-red-600 hover:bg-red-700 animate-pulse'
                                : isTranscribing
                                    ? 'text-orange-500 bg-[#222] cursor-wait'
                                    : 'text-[#666] hover:text-orange-500'
                                }`}
                            title={isRecording ? "Stop Recording" : isTranscribing ? "Transcribing..." : "Voice Input"}
                        >
                            <Mic size={16} />
                        </button>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (handleSend())}
                            disabled={!activeSessionId || status !== 'connected'}
                            placeholder={!activeSessionId ? "Select a chat session..." : "Enter command or script..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[#e5e5e5] placeholder-[#444] py-3 px-2 font-mono text-sm disabled:cursor-not-allowed"
                        />
                        <button onClick={handleSend} className={`p-2 transition-all ${input.trim() ? 'text-orange-500 hover:bg-[#222] rounded-sm' : 'text-[#333] cursor-not-allowed'}`}><ArrowRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* --- Context Sidebar (Static for now) --- */}
            <div className="w-72 hidden 2xl:flex flex-col gap-6">
                <div className="bg-[#161616] border border-[#333] rounded-sm p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Context Stack</h3>
                        <span className="px-1.5 py-0.5 rounded-sm bg-[#222] text-[9px] text-[#666] font-mono border border-[#333]">DYNAMIC</span>
                    </div>
                    <div className="flex-1 p-4 text-[#555] text-xs font-mono text-center mt-10">
                        Context is retrieved automatically via RAG based on your query.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
