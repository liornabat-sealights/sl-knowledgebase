
import { useState } from 'react';
import { apiService } from '@/services/ApiService.ts';
import { useToast } from '@/hooks/use-toast.ts';

export const useLLMSelector = (
  updateMessages: (message: { id: string; content: string; isUser: boolean; timestamp: Date; isError?: boolean }) => void
) => {
  const { toast } = useToast();
  const [selectedLLM, setSelectedLLM] = useState<string>("GPT-4o");

  const updateBackendLLM = async (llmName: string) => {
    try {
      await apiService.setLLM(llmName);

      // Add system message about model change
      updateMessages({
        id: Date.now().toString(),
        content: `LLM model switched to ${llmName}`,
        isUser: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error updating LLM:", error);
      
      // Show toast notification
      toast({
        title: "Error updating LLM",
        description: `Failed to switch to ${llmName}`,
        variant: "destructive",
      });
      
      // Add error message
      updateMessages({
        id: Date.now().toString(),
        content: `Failed to switch to ${llmName}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
        isError: true
      });
    }
  };

  const handleLLMChange = async (value: string) => {
    setSelectedLLM(value);
    await updateBackendLLM(value);
  };

  return { selectedLLM, handleLLMChange };
};
