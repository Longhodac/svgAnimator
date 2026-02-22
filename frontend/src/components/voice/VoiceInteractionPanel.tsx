import { useState, useEffect, useCallback } from 'react';
import { MicrophoneIcon as Mic, CommandLineIcon as Type, PaperAirplaneIcon as Send, UserIcon as User, CpuChipIcon as Bot } from '@heroicons/react/24/outline';
import { VoiceInteractionModal } from './VoiceInteractionModal';
import { TextShimmer } from '../ui/text-shimmer';
import { onVoiceFinal } from '../../voice/events';
import { speak, stop as stopTTS } from '../../voice/tts';
import {
    getWorkflowStatus,
    submitWorkflowPrompt,
    subscribeWorkflowStream,
    type WorkflowStatus,
} from '../../workflow/client';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function VoiceInteractionPanel() {
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('starting');
    const [workflowSession, setWorkflowSession] = useState<string | null>(null);
    const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);
    const [workflowError, setWorkflowError] = useState<string | null>(null);
    const [liveText, setLiveText] = useState('');

    const submitPrompt = useCallback(async (text: string) => {
        const normalized = text.trim();
        if (!normalized) return;

        setMessages(prev => [...prev, { role: 'user', content: normalized }]);
        setInputValue('');
        setIsGenerating(true);
        setWorkflowError(null);
        setLiveText('');

        try {
            const response = await submitWorkflowPrompt(normalized);
            if (response.queued) {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: 'Agent is busy. Your prompt is queued.' },
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: 'Running coding agent workflow...' },
                ]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setWorkflowError(message);
            setIsGenerating(false);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `Error: ${message}` },
            ]);
        }
    }, []);

    const handleSubmit = async (e?: React.FormEvent, voiceText?: string) => {
        if (e) e.preventDefault();
        await submitPrompt(voiceText ?? inputValue);
    };

    useEffect(() => {
        getWorkflowStatus()
            .then((status) => {
                setWorkflowStatus(status.status);
                setWorkflowSession(status.sessionId);
                setIsGenerating(status.status === 'busy' || status.pendingPrompts > 0);
                setWorkflowError(status.lastError ?? null);
            })
            .catch((err) => {
                setWorkflowError(err instanceof Error ? err.message : String(err));
                setWorkflowStatus('error');
            });

        const unsubscribeStream = subscribeWorkflowStream({
            onStatus: (payload) => {
                setWorkflowStatus(payload.status);
                setWorkflowSession(payload.sessionId);
                const isBusy = payload.status === 'busy' || payload.pendingPrompts > 0;
                setIsGenerating(isBusy);
                setWorkflowError(payload.lastError ?? null);
            },
            onLog: ({ stream, line }) => {
                // If the agent sends an [ASSISTANT] message, show it as a chat bubble and speak it
                if (stream === 'system' && line.startsWith('[ASSISTANT] ')) {
                    const text = line.slice('[ASSISTANT] '.length).trim();
                    if (text) {
                        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
                        setIsGenerating(false);
                        setLiveText('');
                        // Speak the response aloud
                        speak(text);
                    }
                    return;
                }
                const tagged = `${stream.toUpperCase()}: ${line}`;
                setWorkflowLogs((prev) => [...prev.slice(-79), tagged]);
            },
            onDelta: (payload) => {
                setLiveText((prev) => prev + payload.text);
            },
            onError: () => {
                // SSE reconnects automatically; don't show transient errors
            },
        });

        const unsubscribe = onVoiceFinal((text) => {
            stopTTS(); // Stop any ongoing TTS when user speaks
            void submitPrompt(text);
            setIsVoiceOpen(false);
        });
        return () => {
            unsubscribe();
            unsubscribeStream();
        };
    }, [submitPrompt]);

    const hasMessages = messages.length > 0;

    return (
        <>
            <div className="relative w-full h-full flex flex-col bg-[#050505]">
                <div className="absolute top-6 left-6 z-20">
                    <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        AI Assistant
                    </span>
                    <span className="mt-1 block text-[10px] text-white/35 font-mono tracking-widest uppercase">
                        workflow: {workflowStatus}{workflowSession ? ` · ${workflowSession}` : ''}
                    </span>
                </div>

                {!hasMessages ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-[300px] mt-12">
                            <button
                                type="button"
                                onClick={() => setIsVoiceOpen(true)}
                                className="flex flex-col items-center justify-center gap-4 w-full py-10 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all text-white/70 hover:text-white"
                            >
                                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                                    <Mic className="w-8 h-8" />
                                </div>
                                <span className="text-sm font-medium tracking-wide">Click to open voice</span>
                            </button>

                            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl border border-white/10 bg-[#111] focus-within:border-white/30 transition-all">
                                <Type className="w-4 h-4 text-[#666] flex-shrink-0" />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Quick prompt..."
                                    className="bg-transparent text-sm text-white placeholder:text-[#666] outline-none w-full font-sans min-w-0"
                                />
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full pt-16">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-[#d4af37]/20 text-[#d4af37]'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-white/10 text-white'
                                        : 'bg-transparent border border-white/10 text-white/90'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isGenerating && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#d4af37]/20 text-[#d4af37]">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-transparent border border-white/10 text-white/90 flex flex-col gap-2">
                                        <TextShimmer className='font-mono text-sm' duration={1}>
                                            Running coding agent workflow...
                                        </TextShimmer>
                                        {liveText && (
                                            <div className="text-xs text-[#888] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto mt-2 p-2 bg-black/40 rounded border border-white/5">
                                                {liveText.slice(-500)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {workflowError && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-300">
                                    {workflowError}
                                </div>
                            )}
                            {workflowLogs.length > 0 && (
                                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                                    <div className="mb-2 text-[10px] text-white/45 font-mono tracking-widest uppercase">
                                        Workflow stream
                                    </div>
                                    <pre className="max-h-48 overflow-y-auto text-[11px] leading-5 text-white/70 font-mono whitespace-pre-wrap">
                                        {workflowLogs.slice(-20).join('\n')}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Chat Input Area */}
                        <div className="p-4 border-t border-white/5 bg-gradient-to-t from-[#050505] to-transparent flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setIsVoiceOpen(true)}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all text-white/80 hover:text-white group shadow-lg"
                            >
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    <Mic className="w-6 h-6" />
                                </div>
                                <span className="font-medium tracking-wide">Use Voice</span>
                            </button>

                            <form
                                onSubmit={handleSubmit}
                                className="flex items-end gap-2 p-2 rounded-2xl border border-white/10 bg-[#111] focus-within:border-white/30 transition-all shadow-lg"
                            >
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            void handleSubmit();
                                        }
                                    }}
                                    placeholder="Or type a quick prompt..."
                                    className="bg-transparent text-sm text-white placeholder:text-[#666] outline-none w-full font-sans min-h-[44px] max-h-[120px] resize-none py-3 px-2"
                                    rows={1}
                                />

                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="p-3 rounded-xl bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-white/30 transition-colors flex-shrink-0 mb-0.5"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <VoiceInteractionModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
        </>
    );
}
