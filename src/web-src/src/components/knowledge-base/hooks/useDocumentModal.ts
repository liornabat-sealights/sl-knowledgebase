
import { useState, useCallback } from 'react';
import { apiService } from '@/services/ApiService';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';

export interface DocumentModalState {
  isOpen: boolean;
  doc: KnowledgeBaseDocModel | null;
  content: string;
  loading: boolean;
  error: string | null;
}

export function useDocumentModal() {
  // Document modal state
  const [docModal, setDocModal] = useState<DocumentModalState>({
    isOpen: false,
    doc: null,
    content: '',
    loading: false,
    error: null,
  });
  
  // Close modal
  const closeDocModal = useCallback(() => {
    setDocModal(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // Handle document viewing
  const handleViewDocument = useCallback(async (doc: KnowledgeBaseDocModel) => {
    setDocModal({
      isOpen: true,
      doc,
      content: '',
      loading: true,
      error: null,
    });
    
    try {
      const response = await apiService.getDocContent(doc.id);
      setDocModal(prev => ({
        ...prev,
        content: response.message,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching document content:", error);
      setDocModal(prev => ({
        ...prev,
        error: "Failed to load document content.",
        loading: false,
      }));
    }
  }, []);
  
  return {
    docModal,
    closeDocModal,
    handleViewDocument,
  };
}
