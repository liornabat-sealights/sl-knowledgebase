
import { useState, useCallback } from 'react';
import { apiService } from '@/services/ApiService';

export interface GraphModalState {
  isOpen: boolean;
  content: string;
  loading: boolean;
  error: string | null;
}

export function useGraphModal() {
  // Graph modal state
  const [graphModal, setGraphModal] = useState<GraphModalState>({
    isOpen: false,
    content: '',
    loading: false,
    error: null,
  });
  
  // Close modal
  const closeGraphModal = useCallback(() => {
    setGraphModal(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // Handle knowledge base graph viewing
  const handleViewKnowledgeBaseGraph = useCallback(async () => {
    setGraphModal({
      isOpen: true,
      content: '',
      loading: true,
      error: null,
    });
    
    try {
      const response = await apiService.getKnowledgeBaseGraph();
      setGraphModal(prev => ({
        ...prev,
        content: response.message,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching knowledge base graph:", error);
      setGraphModal(prev => ({
        ...prev,
        error: "Failed to load knowledge base graph.",
        loading: false,
      }));
    }
  }, []);
  
  return {
    graphModal,
    closeGraphModal,
    handleViewKnowledgeBaseGraph,
  };
}
