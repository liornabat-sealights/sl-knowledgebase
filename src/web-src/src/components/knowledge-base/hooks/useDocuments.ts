
import { useState } from 'react';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';
import { useDocumentModal } from './useDocumentModal';
import { useGraphModal } from './useGraphModal';
import { useDocumentOperations } from './useDocumentOperations';

export interface UseDocumentsResult {
  handleDeleteDocument: (id: string) => Promise<void>;
  handleViewDocument: (doc: KnowledgeBaseDocModel) => Promise<void>;
  handleViewKnowledgeBaseGraph: () => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  docModal: ReturnType<typeof useDocumentModal>['docModal'];
  graphModal: ReturnType<typeof useGraphModal>['graphModal'];
  closeDocModal: () => void;
  closeGraphModal: () => void;
}

/**
 * Hook to manage document operations
 */
export function useDocuments(
  onDocumentChange: () => Promise<void>
): UseDocumentsResult {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use specialized hooks for different functionalities
  const { docModal, closeDocModal, handleViewDocument } = useDocumentModal();
  const { graphModal, closeGraphModal, handleViewKnowledgeBaseGraph } = useGraphModal();
  const { handleDeleteDocument, handleFileUpload } = useDocumentOperations(onDocumentChange);
  
  return {
    handleDeleteDocument,
    handleViewDocument,
    handleViewKnowledgeBaseGraph,
    handleFileUpload,
    searchQuery,
    setSearchQuery,
    docModal,
    graphModal,
    closeDocModal,
    closeGraphModal,
  };
}
