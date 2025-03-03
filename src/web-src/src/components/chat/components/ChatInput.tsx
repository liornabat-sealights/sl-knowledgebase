import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/ui/textarea.tsx';
import MicButton from './MicButton.tsx';
import SendButton from './SendButton.tsx';
import ReplyIndicator from './ReplyIndicator.tsx';
import { useAudioRecording } from '../hooks/useAudioRecording.ts';

// Import the ReplyReference type
interface ReplyReference {
  messageId: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isTyping: boolean;
  replyContent?: string;
  onClearReply?: (messageId?: string) => void;
  // Add new prop for multiple references
  replyReferences?: ReplyReference[];
}

const ChatInput: React.FC<ChatInputProps> = ({
                                               onSendMessage,
                                               onStopGeneration,
                                               isTyping,
                                               replyContent = "",
                                               onClearReply,
                                               replyReferences = []
                                             }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscriptionComplete = (text: string) => {
    onSendMessage(text);
  };

  const {
    isRecording,
    recordingTime,
    formatTime,
    startRecording,
    stopRecording
  } = useAudioRecording({
    onTranscriptionComplete: handleTranscriptionComplete
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;

      // Calculate max height (50% of viewport height)
      const maxHeight = window.innerHeight * 0.5;

      // Set height with a maximum limit of 50% of the viewport
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message?.trim() || isTyping) return;

    onSendMessage(message.trim());
    setMessage('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMainAction = () => {
    if (isTyping) {
      onStopGeneration();
    } else {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  };

  const clearInputAndReply = () => {
    setMessage('');
    if (onClearReply) {
      onClearReply(); // Clear all replies
    }
  };

  // Handler to pass to ReplyIndicator for single references and the clear all button
  const handleReplyIndicatorClear = (messageId?: string) => {
    if (onClearReply) {
      onClearReply(messageId); // If messageId is undefined, it clears all
    }
  };

  // Check if we have any reply content either in the legacy or new format
  const hasReplyContent = (replyContent && replyContent.trim() !== '') || replyReferences.length > 0;

  return (
      <form
          onSubmit={handleSubmit}
          className="w-full p-4 bg-background/90 backdrop-blur-sm flex items-end gap-3"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3">
          <ReplyIndicator
              hasReplyContent={hasReplyContent}
              replyContent={replyContent}
              onClearReply={handleReplyIndicatorClear}
              replyReferences={replyReferences}
          />

          <div className="relative flex items-end gap-3">
            <div className="relative flex-1">
              <Textarea
                  ref={textareaRef}
                  value={message || ''}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? `Recording... ${formatTime(recordingTime)}` : "Type a question..."}
                  className="min-h-[40px] pr-10 resize-none border rounded-lg focus-visible:ring-1 bg-background transition-all"
                  maxLength={10000}
                  disabled={isTyping || isRecording}
                  rows={1}
              />
              {message && (
                  <button
                      type="button"
                      onClick={clearInputAndReply}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1 rounded-full"
                      aria-label="Clear input"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
              )}
            </div>

            <MicButton
                isRecording={isRecording}
                recordingTime={recordingTime}
                formatTime={formatTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                disabled={isTyping}
            />

            <SendButton
                isTyping={isTyping}
                disabled={(!message?.trim() && !isRecording && !isTyping)}
                onClick={handleMainAction}
            />
          </div>
        </div>
      </form>
  );
};

export default ChatInput;