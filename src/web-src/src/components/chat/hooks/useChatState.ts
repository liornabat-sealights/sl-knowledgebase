import { useStatusCheck } from './useStatusCheck.ts';
import { useLLMSelector } from './useLLMSelector.ts';
import { useMessageHandler } from './useMessageHandler.ts';

export const useChatState = () => {
  const { kbStatus } = useStatusCheck();

  const {
    messages,
    isTyping,
    streamingResponse,
    replyContent,
    replyReferences,
    updateMessages,
    handleSendMessage,
    handleStopGeneration,
    handleReply,
    handleClearReply,
    handleRegenerateResponse,
    handleClearChat
  } = useMessageHandler(kbStatus);

  const { selectedLLM, handleLLMChange } = useLLMSelector(updateMessages);

  return {
    messages,
    isTyping,
    streamingResponse,
    replyContent,
    replyReferences,
    selectedLLM,
    kbStatus,
    handleLLMChange,
    handleSendMessage,
    handleStopGeneration,
    handleReply,
    handleClearReply,
    handleRegenerateResponse,
    handleClearChat
  };
};

// Export this correctly from types.ts where it's defined, not here
export { statusColors } from '../types.ts';