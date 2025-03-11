import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage.tsx';

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    responseTime?: number;
    previousQuery?: string;
    isError?: boolean;
    isHistory?: boolean;
    contextMessageId?: string;
    // Single reply context (for backward compatibility)
    replyContext?: {
        content: string;
        timestamp: Date;
        isUser: boolean;
    };
    // New property for multiple reply contexts
    replyContexts?: Array<{
        content: string;
        timestamp: Date;
        isUser: boolean;
    }>;
}

interface MessageListProps {
    messages: Message[];
    isTyping: boolean;
    streamingResponse: string;
    onRegenerate: (previousQuery: string) => void;
    onStopGeneration: () => void;
    onReply?: (messageId: string) => void;
    onAddSelectionToReferences?: (selectedText: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
                                                     messages,
                                                     isTyping,
                                                     streamingResponse,
                                                     onRegenerate,
                                                     onStopGeneration,
                                                     onReply,
                                                     onAddSelectionToReferences
                                                 }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMessageLengthRef = useRef<number>(0);
    const lastScrollHeightRef = useRef<number>(0);
    const lastScrollTopRef = useRef<number>(0);
    const isUserScrollingRef = useRef<boolean>(false);

    // Track when a user scrolls manually
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // Save the scroll position
            lastScrollTopRef.current = container.scrollTop;

            // Check if user is scrolling up
            const isScrollingUp = container.scrollTop < lastScrollHeightRef.current - container.clientHeight - 50;
            isUserScrollingRef.current = isScrollingUp;
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Specifically handle streaming responses
    useEffect(() => {
        if (isTyping && streamingResponse) {
            // Only auto scroll if the user isn't manually scrolling up
            if (!isUserScrollingRef.current) {
                scrollToBottom();
            }

            // Update reference for stream length
            lastMessageLengthRef.current = streamingResponse.length;
        }
    }, [streamingResponse]);

    // Handle new user messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            // Always scroll down for new user messages
            if (lastMessage && lastMessage.isUser) {
                scrollToBottom();
                isUserScrollingRef.current = false;
            }
        }
    }, [messages.length]);

    // Keep track of container height
    useEffect(() => {
        if (containerRef.current) {
            lastScrollHeightRef.current = containerRef.current.scrollHeight;
        }
    }, [messages, streamingResponse]);

    // Improved scroll function to keep scrolling within the container
    const scrollToBottom = () => {
        if (containerRef.current && messagesEndRef.current) {
            // Use scrollTop to scroll within the container instead of scrollIntoView
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    };

    // If there are no messages and not typing, show a welcome message
    if (messages.length === 0 && !isTyping) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <h3 className="text-2xl font-bold mb-2">Welcome to Sealights!</h3>
                <p className="text-muted-foreground mb-6">
                    How can I help you today? Ask me anything about integrating Sealights or using our platform.
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="p-4 h-full overflow-y-auto">
            {messages.map((message) => (
                <ChatMessage
                    key={message.id}
                    message={message.content}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                    responseTime={message.responseTime}
                    isError={message.isError}
                    isHistory={message.isHistory}
                    replyContext={message.replyContext}
                    replyContexts={message.replyContexts}
                    onRegenerate={
                        !message.isUser && message.previousQuery
                            ? () => onRegenerate(message.previousQuery!)
                            : undefined
                    }
                    onReply={
                        !message.isUser && !message.isHistory && onReply
                            ? () => onReply(message.id)
                            : undefined
                    }
                    onAddSelectionToReferences={
                        !message.isUser && onAddSelectionToReferences
                            ? onAddSelectionToReferences
                            : undefined
                    }
                />
            ))}

            {isTyping && (
                <ChatMessage
                    message={streamingResponse || ""}
                    isUser={false}
                    timestamp={new Date()}
                    isLoading={true}
                    streamingResponse={!!streamingResponse}
                    onStopGeneration={onStopGeneration}
                />
            )}

            {/* Simple scroll target that's always at the bottom */}
            <div ref={messagesEndRef} className="h-4" />
        </div>
    );
};

export default MessageList;