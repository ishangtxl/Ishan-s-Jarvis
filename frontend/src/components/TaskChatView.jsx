import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Cpu, Paperclip, ArrowRight, FileText, Upload, Bot, Terminal, Brain, ChevronRight, Mic
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { tasksApi, chatApi } from '../api/client';

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

    const hasOpening = content.includes('<think>');
    const hasClosing = content.includes('</think>');

    if (hasOpening) {
        const parts = content.split(/(<think>[\s\S]*?<\/think>)/g);
        return (
            <div className="font-mono text-sm leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('<think>')) {
                        if (part.endsWith('</think>')) {
                            const thought = part.replace(/<\/?think>/g, '').trim();
                            return <ThoughtBlock key={i} thought={thought} />;
                        } else {
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

    return <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">{content}</div>;
};

const TaskChatView = ({ task, onBack }) => {
    const [sessionId, setSessionId] = useState(null);
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Chat Hook & Logic
    const { messages, sendMessage, status } = useChat(sessionId);

    useEffect(() => {
        if (task?.id) {
            initSession();
            loadFiles();
        }
    }, [task]);

    const initSession = async () => {
        try {
            const res = await tasksApi.getChatSession(task.id);
            setSessionId(res.data.id);
        } catch (err) {
            console.error("Failed to init task chat session", err);
        }
    };

    const loadFiles = async () => {
        try {
            const res = await tasksApi.getFiles(task.id);
            setFiles(res.data);
        } catch (err) {
            console.error("Failed to load task files", err);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const res = await tasksApi.uploadFile(task.id, file);
            setFiles([...files, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    // Voice Input Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const file = new File([audioBlob], "recording.wav", { type: "audio/wav" });
                setIsTranscribing(true);
                try {
                    const res = await chatApi.transcribe(file);
                    setInput(prev => (prev ? prev + " " + res.data.text : res.data.text));
                } catch (err) {
                    console.error("Transcription failed", err);
                } finally {
                    setIsTranscribing(false);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleMicClick = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#111] shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-[#666] hover:text-[#e5e5e5] hover:bg-[#333] rounded-sm transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[#e5e5e5] text-sm tracking-tight truncate max-w-[200px]">{task.title}</span>
                            <span className={`text-[9px] font-mono px-1.5 rounded-sm uppercase border tracking-wider ${task.priority === 'high' ? 'bg-rose-900/10 border-rose-900/30 text-rose-500' :
                                    'bg-[#222] border-[#333] text-[#666]'
                                }`}>{task.priority || 'NORMAL'}</span>
                        </div>
                        <span className="text-[10px] text-[#666] font-mono">Task Assistant • {files.length} Files Linked</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Files & Context (Visible on lg+) */}
                <div className="w-72 lg:w-80 border-r border-[#333] flex flex-col bg-[#111] hidden md:flex">
                    <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#161616]">
                        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-orange-500" /> Files
                        </h3>
                        <span className="px-1.5 py-0.5 rounded-sm bg-[#222] text-[9px] text-[#666] font-mono border border-[#333]">{files.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <div className="p-3 mb-2 bg-[#1a1a1a] rounded-sm border border-[#333] text-xs text-[#888] italic font-mono">
                            {task.description || "No description provided for this task."}
                        </div>

                        {loadingFiles ? (
                            <div className="p-4 text-[#555] text-xs font-mono text-center">Loading files...</div>
                        ) : files.map((file) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded-sm cursor-pointer text-[#888] hover:text-[#e5e5e5] font-mono text-xs transition-colors group">
                                <FileText size={12} className="group-hover:text-orange-500 transition-colors" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate">{file.filename}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-[#333] bg-[#1a1a1a]">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 border border-dashed border-[#333] rounded-sm text-[#444] hover:text-[#888] hover:border-[#555] text-xs font-mono uppercase transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload size={12} /> Add Files
                        </button>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0d0d0d] relative min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-[#444] space-y-4">
                                <Cpu size={48} strokeWidth={1} />
                                <p className="font-mono text-sm">Task context initialized.</p>
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
                            {/* Paperclip now triggers the hidden file input */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-[#666] hover:text-[#e5e5e5] transition-colors"
                                title="Attach File"
                            >
                                <Paperclip size={16} />
                            </button>

                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (handleSend())}
                                placeholder={`Ask about "${task.title}"...`}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-[#e5e5e5] placeholder-[#444] py-3 px-2 font-mono text-sm"
                                disabled={status !== 'connected'}
                            />

                            {/* Mic Button */}
                            <button
                                onClick={handleMicClick}
                                disabled={isTranscribing}
                                className={`p-2 transition-colors tooltip rounded-sm mr-1 ${isRecording
                                    ? 'text-white bg-red-600 hover:bg-red-700 animate-pulse'
                                    : isTranscribing
                                        ? 'text-orange-500 bg-[#222] cursor-wait'
                                        : 'text-[#666] hover:text-orange-500'
                                    }`}
                                title={isRecording ? "Stop Recording" : isTranscribing ? "Transcribing..." : "Voice Input"}
                            >
                                <Mic size={16} />
                            </button>

                            <button onClick={handleSend} className={`p-2 transition-all ${input.trim() ? 'text-orange-500 hover:bg-[#222] rounded-sm' : 'text-[#333] cursor-not-allowed'}`}><ArrowRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskChatView;
