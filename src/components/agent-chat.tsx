'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StepCard } from './step-card';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MCQCard } from './mcq-card';

interface AgentChatProps {
    projectId: string;
    initialMessages?: any[];
    onArchitectureUpdate?: () => void;
}

export default function AgentChat({ projectId, initialMessages = [], onArchitectureUpdate }: AgentChatProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const prevArchCountRef = useRef(0);
    // track pending MCQ tool calls waiting for answer
    const [pendingToolCallId, setPendingToolCallId] = useState<string | null>(null);

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: ({ messages }) => ({
                body: { messages, projectId },
            }),
        }),
        messages: initialMessages,
        // 👇 NO sendAutomaticallyWhen — we handle manually
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const archUpdates = messages
            .flatMap(m => m.parts ?? [])
            .filter(
                (p: any) =>
                    p.type === 'tool-update_architecture' &&
                    p.state === 'output-available'
            ).length;

        if (archUpdates > prevArchCountRef.current) {
            prevArchCountRef.current = archUpdates;
            onArchitectureUpdate?.();
        }
    }, [messages, onArchitectureUpdate]);

    // 👇 detect when agent is waiting for ask_user answer
    useEffect(() => {
        const pending = messages
            .flatMap(m => m.parts ?? [])
            .find(
                (p: any) =>
                    p.type === 'tool-ask_user' &&
                    p.state === 'input-available'
            ) as any;

        setPendingToolCallId(pending?.toolCallId ?? null);
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: input }],
        });
        setInput('');
    };

    // 👇 called when user picks an MCQ option
    const handleMCQAnswer = (toolCallId: string, answer: string) => {
        setPendingToolCallId(null);
        // Send the answer as a plain user message — agent sees it and continues
        sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: answer }],
        });
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 min-h-0" type="always">
                <div className="flex flex-col gap-4 p-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            <p className="text-2xl mb-2">🦞</p>
                            <p className="font-medium">ClawGen is ready</p>
                            <p className="text-sm mt-1">Describe what you want to build</p>
                            <p className="text-xs mt-3 text-muted-foreground/60">
                                e.g. "Build a Telegram bot that monitors Gmail and sends daily summaries"
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div key={message.id} className="flex flex-col gap-2">

                            {message.role === 'user' && (
                                <div className="flex justify-end">
                                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
                                        {message.parts?.map((part: any, i: number) =>
                                            part.type === 'text' ? <span key={i}>{part.text}</span> : null
                                        )}
                                    </div>
                                </div>
                            )}

                            {message.role === 'assistant' && (
                                <div className="flex flex-col gap-2">
                                    {message.parts?.map((part: any, i: number) => {

                                        if (part.type === 'tool-ask_user') {
                                            const question = part.input?.question ?? '';
                                            const options = part.input?.options ?? [];
                                            // locked once answered
                                            let answered = part.state === 'output-available'
                                                ? (part.output?.answer ?? true)
                                                : undefined;

                                            // Persistent selection fallback: if not officially answered, 
                                            // check if the next message matches one of the options.
                                            if (!answered && message.role === 'assistant') {
                                                const msgIndex = messages.indexOf(message);
                                                const nextMsg = messages[msgIndex + 1];
                                                if (nextMsg?.role === 'user') {
                                                    const textPart = nextMsg.parts?.find((p: any) => 
                                                        p.type === 'text' && typeof p.text === 'string'
                                                    );
                                                    const userText = (textPart as any)?.text;
                                                    if (userText && options.includes(userText)) {
                                                        answered = userText;
                                                    }
                                                }
                                            }

                                            return (
                                                <MCQCard
                                                    key={part.toolCallId ?? i}
                                                    question={question}
                                                    options={options}
                                                    answered={answered}
                                                    onAnswer={(answer) =>
                                                        handleMCQAnswer(part.toolCallId, answer)
                                                    }
                                                />
                                            );
                                        }

                                        if (part.type?.startsWith('tool-')) {
                                            const toolName = part.type.replace('tool-', '');
                                            const state =
                                                part.state === 'output-available' ? 'done' :
                                                    part.state === 'input-available' ? 'calling' : 'error';
                                            return (
                                                <StepCard
                                                    key={part.toolCallId ?? i}
                                                    toolName={toolName}
                                                    args={part.input}
                                                    result={part.output}
                                                    state={state}
                                                />
                                            );
                                        }

                                        if (part.type === 'text' && part.text) {
                                            return (
                                                <div
                                                    key={i}
                                                    className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] text-sm prose prose-sm prose-neutral dark:prose-invert"
                                                >
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {part.text}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            )}

                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span>ClawGen is working...</span>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            <Separator />

            <div className="p-4 flex gap-2">
                <Textarea
                    placeholder="Describe what you want to build... (Enter to send, Shift+Enter for newline)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="resize-none min-h-[60px] max-h-[120px]"
                    rows={2}
                />
                <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="self-end"
                >
                    Send
                </Button>
            </div>
        </div>
    );
}
