import React from 'react';
import ChatInput from './ChatInput.tsx';
import ChatHeader from './ChatHeader.tsx';
import QuickQuestions from './QuickQuestions.tsx';
import MessageList from './MessageList.tsx';
import { useChatState } from '../hooks/useChatState.ts';

const ChatContainer: React.FC = () => {
    const {
        messages,
        isTyping,
        streamingResponse,
        selectedLLM,
        kbStatus,
        replyContent,
        replyReferences,
        handleLLMChange,
        handleSendMessage,
        handleStopGeneration,
        handleRegenerateResponse,
        handleClearChat,
        handleReply,
        handleClearReply
    } = useChatState();

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
            {/* Fixed header section */}
            <div className="flex-none bg-background border-b">
                <div className="px-4 pt-4 pb-2">
                    <ChatHeader
                        kbStatus={kbStatus}
                        selectedLLM={selectedLLM}
                        onLLMChange={handleLLMChange}
                        onClearChat={handleClearChat}
                    />
                </div>

                {/* Quick Questions section */}
                <div className="px-4 py-3 border-t border-border/40">
                    <QuickQuestions onSendMessage={handleSendMessage} />
                </div>
            </div>

            {/* Scrollable message area - only this section should scroll */}
            <div className="flex-1 overflow-hidden">
                <MessageList
                    messages={messages}
                    isTyping={isTyping}
                    streamingResponse={streamingResponse}
                    onRegenerate={handleRegenerateResponse}
                    onStopGeneration={handleStopGeneration}
                    onReply={handleReply}
                />
            </div>

            {/* Fixed input area at bottom */}
            <div className="flex-none bg-background border-t border-border">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    isTyping={isTyping}
                    replyContent={replyContent}
                    replyReferences={replyReferences}
                    onClearReply={handleClearReply}
                />
            </div>
        </div>
    );
};

export default ChatContainer;