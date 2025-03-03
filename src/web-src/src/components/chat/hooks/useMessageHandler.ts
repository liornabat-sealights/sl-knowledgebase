import { useState, useRef, useEffect } from 'react';
import { apiService } from '@/services/ApiService.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { Message, MessageHistoryItem } from '../types.ts';
import { StatusType } from '../components/StatusIndicator.tsx';

// Define a type for reply references
interface ReplyReference {
  messageId: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

export const useMessageHandler = (kbStatus: StatusType) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [requestStartTime, setRequestStartTime] = useState<number | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState<string>("");
  
  // Replace single reference with an array of references
  const [replyReferences, setReplyReferences] = useState<ReplyReference[]>([]);
  const [replyContent, setReplyContent] = useState<string>("");

  const isFinalizingResponseRef = useRef(false);

  const updateMessages = (message: Omit<Message, 'id'> & { id?: string }) => {
    const newMessage = {
      ...message,
      id: message.id || Date.now().toString()
    };

    setMessages(prev => [...prev, newMessage as Message]);
  };

  const handleStopGeneration = () => {
    apiService.abortRequest();

    setIsTyping(false);
    setCurrentMessageId(null);

    const stoppedResponse = streamingResponse
        ? streamingResponse + "\n\n_Generation stopped by user._"
        : "Generation stopped by user.";

    const endTime = Date.now();
    const responseTime = requestStartTime ? endTime - requestStartTime : undefined;

    if (currentMessageId) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== currentMessageId),
        {
          id: currentMessageId,
          content: stoppedResponse,
          isUser: false,
          timestamp: new Date(),
          responseTime,
          previousQuery: lastUserQuery
        }
      ]);
    }

    setStreamingResponse("");
    setRequestStartTime(null);
    // Clear all reply references
    setReplyReferences([]);
    setReplyContent("");
  };

  // Modified to add a message to the references instead of replacing
  const handleReply = (messageId: string) => {
    const targetMessage = messages.find(m => m.id === messageId);
    if (!targetMessage || targetMessage.isUser) return;

    // Check if this message is already referenced to avoid duplicates
    if (replyReferences.some(ref => ref.messageId === messageId)) {
      return;
    }

    // Add the new reference to the array
    setReplyReferences(prev => [
      ...prev,
      {
        messageId,
        content: targetMessage.content,
        timestamp: targetMessage.timestamp,
        isUser: targetMessage.isUser
      }
    ]);

    // Update reply content for backward compatibility
    setReplyContent(targetMessage.content);
  };

  // Updated to allow removing individual references
  const handleClearReply = (messageId?: string) => {
    if (messageId) {
      // Remove only the specified reference
      setReplyReferences(prev => prev.filter(ref => ref.messageId !== messageId));
      
      // If that was the last one, clear the content too
      if (replyReferences.length <= 1) {
        setReplyContent("");
      }
    } else {
      // Clear all references if no messageId specified
      setReplyReferences([]);
      setReplyContent("");
    }
  };

  const collectMessageHistory = (): MessageHistoryItem[] => {
    if (replyReferences.length === 0) return [];

    const history: MessageHistoryItem[] = [];

    // Loop through all referenced messages
    for (const reference of replyReferences) {
      const targetMessage = messages.find(m => m.id === reference.messageId);
      if (!targetMessage || targetMessage.isUser) continue;

      const userMessage = messages.find(m =>
          m.content === targetMessage.previousQuery && m.isUser
      );

      if (userMessage && targetMessage) {
        history.push(
          { role: "user", content: userMessage.content },
          { role: "assistant", content: targetMessage.content }
        );
      } else if (targetMessage.previousQuery) {
        history.push(
          { role: "user", content: targetMessage.previousQuery },
          { role: "assistant", content: targetMessage.content }
        );
      }
    }

    return history;
  };

  const fetchResponse = async (content: string) => {
    if (kbStatus === 'Offline') {
      toast({
        title: "API is offline",
        description: "Cannot process your request at this time. Please try again later.",
        variant: "destructive",
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "I'm sorry, but the API is currently offline. Please check your connection and try again later.",
          isUser: false,
          timestamp: new Date(),
          isError: true
        }
      ]);

      return;
    }

    const startTime = Date.now();
    setRequestStartTime(startTime);
    setIsTyping(true);
    setStreamingResponse("");

    try {
      const responseId = (Date.now() + 1).toString();
      setCurrentMessageId(responseId);

      // Use message history from all references, not just one
      const messagesHistory = replyReferences.length > 0 ? collectMessageHistory() : undefined;

      const responseText = await apiService.sendQuery(content, (chunkText) => {
        setStreamingResponse(chunkText);
      }, messagesHistory);

      const endTime = Date.now();
      const totalResponseTime = endTime - startTime;

      const finalResponseText = responseText;
      const finalResponseTime = totalResponseTime;

      // Use the first referenced message ID for contextMessageId if available
      const contextMessageId = replyReferences.length > 0 ? replyReferences[0].messageId : undefined;

      setMessages(prev => [
        ...prev.filter(m => m.id !== responseId),
        {
          id: responseId,
          content: finalResponseText,
          isUser: false,
          timestamp: new Date(),
          responseTime: finalResponseTime,
          previousQuery: content,
          contextMessageId
        }
      ]);

      setTimeout(() => {
        setStreamingResponse("");
        setRequestStartTime(null);
        setCurrentMessageId(null);
        setReplyReferences([]);
        setReplyContent("");
        setIsTyping(false);
      }, 100);

    } catch (error) {
      console.error("Error streaming response:", error);

      if ((error as Error).name !== 'AbortError') {
        const errorMessage = (error as Error).message || "An unknown error occurred";

        toast({
          title: "Error processing request",
          description: errorMessage,
          variant: "destructive",
        });

        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              content: "I'm sorry, but the API appears to be offline. Please check your connection and try again later.",
              isUser: false,
              timestamp: new Date(),
              isError: true
            }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              content: "I'm sorry, I encountered an error processing your request. Please try again.",
              isUser: false,
              timestamp: new Date(),
              isError: true
            }
          ]);
        }
      }

      setTimeout(() => {
        setIsTyping(false);
        setCurrentMessageId(null);
        setStreamingResponse("");
        setRequestStartTime(null);
        setReplyReferences([]);
        setReplyContent("");
      }, 50);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Convert all reply references to the replyContext format
    const replyContexts = replyReferences.map(ref => ({
      content: ref.content,
      timestamp: ref.timestamp,
      isUser: ref.isUser
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
      // Use an array of reply contexts if there are references
      replyContexts: replyContexts.length > 0 ? replyContexts : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLastUserQuery(content);

    // Clear reply state after sending message
    setReplyReferences([]);
    setReplyContent("");

    await fetchResponse(content);
  };

  const handleRegenerateResponse = async (previousQuery: string) => {
    setMessages(prev => prev.filter(message =>
        !(message.previousQuery === previousQuery && !message.isUser) ||
        message.isUser
    ));

    await fetchResponse(previousQuery);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Conversation cleared. How can I help you today?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
    setReplyReferences([]);
    setReplyContent("");
  };

  return {
    messages,
    isTyping,
    streamingResponse,
    replyContent,
    replyReferences, // Export the references
    updateMessages,
    handleSendMessage,
    handleStopGeneration,
    handleReply,
    handleClearReply,
    handleRegenerateResponse,
    handleClearChat
  };
};