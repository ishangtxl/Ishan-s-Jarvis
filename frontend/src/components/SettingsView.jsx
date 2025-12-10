import React, { useState, useEffect } from 'react';
import { Server, Database, Cpu, HardDrive, FolderOpen, Info, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const SettingsView = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/config');
            setConfig(response.data);
        } catch (err) {
            console.error("Failed to fetch config:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-[#666] font-mono text-sm flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading configuration...
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-[#666] font-mono text-sm">Failed to load configuration</div>
            </div>
        );
    }

    const ConfigCard = ({ title, icon: Icon, children }) => (
        <div className="bg-[#161616] border border-[#333] rounded-sm overflow-hidden">
            <div className="p-4 border-b border-[#333] bg-[#1a1a1a] flex items-center gap-3">
                <div className="p-2 bg-[#222] rounded-sm border border-[#333]">
                    <Icon size={16} className="text-orange-500" />
                </div>
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">{title}</h3>
            </div>
            <div className="p-4 space-y-3">
                {children}
            </div>
        </div>
    );

    const ConfigItem = ({ label, value, status }) => (
        <div className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
            <span className="text-xs font-mono text-[#888] uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-[#e5e5e5]">{value}</span>
                {status !== undefined && (
                    status ? (
                        <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                        <XCircle size={14} className="text-red-500" />
                    )
                )}
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-2">Settings</h2>
                    <p className="text-[#666] font-mono text-xs">System configuration and environment details</p>
                </div>

                {/* Application Info */}
                <div className="mb-6">
                    <ConfigCard title="Application" icon={Info}>
                        <ConfigItem label="Name" value={config.app_name} />
                        <ConfigItem label="Mode" value={config.debug ? "Development" : "Production"} />
                        <ConfigItem
                            label="Status"
                            value="Online"
                            status={true}
                        />
                    </ConfigCard>
                </div>

                {/* LLM Configuration */}
                <div className="mb-6">
                    <ConfigCard title="Language Model" icon={Cpu}>
                        <ConfigItem label="Model" value={config.llm.model} />
                        <ConfigItem label="Embedding Model" value={config.llm.embedding_model} />
                        <ConfigItem label="Base URL" value={config.llm.base_url} />
                        <div className="mt-4 p-3 bg-[#111] rounded-sm border border-[#222]">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#888] font-mono">
                                    <div className="mb-1 text-orange-500 font-bold">Ollama Local LLM</div>
                                    <div>Running locally on your machine. No data is sent to external servers.</div>
                                </div>
                            </div>
                        </div>
                    </ConfigCard>
                </div>

                {/* Vector Database */}
                <div className="mb-6">
                    <ConfigCard title="Vector Database (RAG)" icon={Database}>
                        <ConfigItem label="Provider" value={config.vector_db.provider} />
                        <ConfigItem label="Environment" value={config.vector_db.environment} />
                        <ConfigItem label="Index Name" value={config.vector_db.index_name} />
                        <ConfigItem
                            label="Status"
                            value={config.vector_db.enabled ? "Enabled" : "Disabled"}
                            status={config.vector_db.enabled}
                        />
                        <div className="mt-4 p-3 bg-[#111] rounded-sm border border-[#222]">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#888] font-mono">
                                    <div className="mb-1 text-orange-500 font-bold">Retrieval Augmented Generation</div>
                                    <div>Enables AI to answer questions using your uploaded documents.</div>
                                    {!config.vector_db.enabled && (
                                        <div className="mt-2 text-red-400">⚠ Set PINECONE_API_KEY in .env to enable</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ConfigCard>
                </div>

                {/* Database */}
                <div className="mb-6">
                    <ConfigCard title="Database" icon={Server}>
                        <ConfigItem label="Type" value={config.database.type} />
                        <ConfigItem label="Location" value={config.database.url} />
                        <div className="mt-4 p-3 bg-[#111] rounded-sm border border-[#222]">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#888] font-mono">
                                    <div className="mb-1 text-orange-500 font-bold">SQLite Database</div>
                                    <div>Lightweight, file-based database for storing chat history, tasks, and projects.</div>
                                </div>
                            </div>
                        </div>
                    </ConfigCard>
                </div>

                {/* Storage */}
                <div className="mb-6">
                    <ConfigCard title="File Storage" icon={FolderOpen}>
                        <ConfigItem label="Upload Directory" value={config.storage.upload_dir} />
                        <div className="mt-4 p-3 bg-[#111] rounded-sm border border-[#222]">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#888] font-mono">
                                    <div className="mb-1 text-orange-500 font-bold">Local File Storage</div>
                                    <div>Uploaded files are stored locally and processed for embeddings.</div>
                                </div>
                            </div>
                        </div>
                    </ConfigCard>
                </div>

                {/* System Requirements */}
                <div className="mb-6">
                    <ConfigCard title="System Requirements" icon={HardDrive}>
                        <div className="space-y-2 text-xs font-mono text-[#888]">
                            <div className="flex items-center justify-between py-2 border-b border-[#222]">
                                <span className="uppercase tracking-wider">Python</span>
                                <span className="text-[#e5e5e5]">3.13+</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-[#222]">
                                <span className="uppercase tracking-wider">Node.js</span>
                                <span className="text-[#e5e5e5]">18+</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-[#222]">
                                <span className="uppercase tracking-wider">Ollama</span>
                                <span className="text-[#e5e5e5]">Latest</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="uppercase tracking-wider">RAM</span>
                                <span className="text-[#e5e5e5]">4GB+ (8GB recommended)</span>
                            </div>
                        </div>
                    </ConfigCard>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-center">
                    <button
                        onClick={fetchConfig}
                        className="flex items-center gap-2 px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#444] text-[#ccc] rounded-sm transition-colors text-xs font-mono uppercase tracking-wider"
                    >
                        <RefreshCw size={14} />
                        Refresh Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
