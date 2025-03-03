import React from 'react';
import { Copy, RotateCw, MessageSquareQuote, Quote, MessageSquareQuote as QuoteIcon } from 'lucide-react';
import { Button } from '@/ui/button';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { toast } from '@/ui/use-toast';

interface ReplyContextItem {
    content: string;
    timestamp: Date;
    isUser: boolean;
}

interface ChatMessageProps {
    message: string;
    isUser: boolean;
    timestamp: Date;
    responseTime?: number;
    isError?: boolean;
    isLoading?: boolean;
    streamingResponse?: boolean;
    onRegenerate?: () => void;
    onStopGeneration?: () => void;
    onReply?: () => void;
    isHistory?: boolean;
    replyContext?: ReplyContextItem;
    replyContexts?: ReplyContextItem[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({
                                                     message,
                                                     isUser,
                                                     timestamp,
                                                     responseTime,
                                                     isError = false,
                                                     isLoading = false,
                                                     streamingResponse = false,
                                                     onRegenerate,
                                                     onStopGeneration,
                                                     onReply,
                                                     isHistory = false,
                                                     replyContext,
                                                     replyContexts
                                                 }) => {
    // Format the timestamp to show actual time HH:MM:SS instead of relative time
    const formattedTime = format(new Date(timestamp), 'HH:mm:ss');

    const formatResponseTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(message);
        
        // Show a toast notification when the message is copied
        toast({
            title: "Copied to clipboard",
            description: "The message has been copied to your clipboard.",
            duration: 2000, // 2 seconds
        });
    };

    // Combine single replyContext with replyContexts array if both exist
    const allReplyContexts = replyContexts || (replyContext ? [replyContext] : []);

    return (
        <div className={cn(
            "flex mb-6 justify-start",
            isHistory && "pl-6 border-l-2 border-muted"
        )}>
            <div className="flex items-start gap-3 max-w-[95%] w-full">
                {/* Avatar */}
                <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white",
                    isUser ? "bg-gray-700" : "bg-blue-500"
                )}>
                    {isUser ? (
                        <span>Y</span>
                    ) : (
                        <span>KB</span>
                    )}
                </div>

                {/* Message content */}
                <div className={cn(
                    "rounded-lg px-4 py-3 w-full overflow-x-hidden break-words",
                    isUser
                        ? "bg-muted"
                        : isError
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : isHistory
                                ? "bg-accent/50 border border-border"
                                : "bg-background border border-border"
                )}>
                    {/* Header with name and time */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                            {isUser ? 'You' : 'Knowledge Base'}
                        </span>
                        <span className="text-xs text-muted-foreground"> at {formattedTime}</span>
                        {isHistory && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                History
                            </span>
                        )}
                    </div>

                    {/* Multiple Reply Contexts (if present) */}
                    {allReplyContexts.length > 0 && (
                        <div className="mb-3 border border-border rounded-md overflow-hidden">
                            {allReplyContexts.map((ctx, index) => (
                                <div key={index} className={cn(
                                    index > 0 && "border-t border-border"
                                )}>
                                    <div className="bg-secondary/30 px-3 py-1.5 border-b border-border flex items-center gap-2">
                                        <MessageSquareQuote size={14} className="text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                            {ctx.isUser ? 'You' : 'Knowledge Base'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            at {format(new Date(ctx.timestamp), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-background/50 prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                        >
                                            {ctx.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Message content */}
                    <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-hidden break-words">
                        {isLoading ? (
                            <div>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                >
                                    {message}
                                </ReactMarkdown>
                                {streamingResponse ? (
                                    <span className="inline-block ml-1 typing-indicator"></span>
                                ) : (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="typing-dots text-muted-foreground">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {message}
                            </ReactMarkdown>
                        )}
                    </div>

                    {/* Action buttons with response time - Only showing for completed messages */}
                    {!isUser && !isLoading && (
                        <div className="mt-2 flex justify-between items-center">
                            {/* Response time on the left */}
                            <span className="text-xs text-muted-foreground">
                                {responseTime ? `Response time: ${formatResponseTime(responseTime)}` : ''}
                            </span>

                            {/* Buttons on the right */}
                            <div className="flex gap-2 ml-auto">
                                {/* Regenerate button - only shown for non-loading assistant responses */}
                                {onRegenerate && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={onRegenerate}
                                        title="Regenerate response"
                                    >
                                        <RotateCw size={14} />
                                    </Button>
                                )}

                                {/* Quote button (formerly Reply button) - only shown for non-loading assistant responses */}
                                {onReply && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={onReply}
                                        title="Reference this message in your reply"
                                    >
                                        <QuoteIcon size={14} />
                                    </Button>
                                )}

                                {/* Copy button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={handleCopyMessage}
                                    title="Copy message"
                                >
                                    <Copy size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
