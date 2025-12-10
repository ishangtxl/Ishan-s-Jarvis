import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../api/client';

export const useChat = (sessionId) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial load of history
    useEffect(() => {
        if (!sessionId || sessionId === 'new') return;

        chatApi.getSession(sessionId).then(res => {
            setMessages(res.data.messages || []);
        });
    }, [sessionId]);

    // WebSocket Connection
    useEffect(() => {
        if (!sessionId || sessionId === 'new') return;

        setStatus('connecting');
        // Proxy handles /api/chat/ws -> ws://backend/api/chat/ws
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws/${sessionId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('connected');
        };

        ws.onmessage = (event) => {
            const text = event.data;
            // Assuming the backend streams text chunks.
            // We need to append to the LAST message if it's from assistant and we are streaming.
            // Or if it's a new message?
            // The backend streams content.
            // Simplified: Add chunks to the last message if it's 'assistant' and 'streaming'.
            // But state updates with streaming are tricky.

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + text }
                    ];
                } else {
                    // New assistant message starting
                    return [...prev, { role: 'assistant', content: text, isStreaming: true }];
                }
            });
        };

        ws.onclose = () => {
            setStatus('disconnected');
        };

        return () => {
            ws.close();
        };
    }, [sessionId]);

    const sendMessage = useCallback((text) => {
        if (!wsRef.current || status !== 'connected') return;

        // Add user message locally instantly
        const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);

        // Prepare for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

        wsRef.current.send(text);
    }, [status]);

    return {
        messages,
        sendMessage,
        status
    };
};
