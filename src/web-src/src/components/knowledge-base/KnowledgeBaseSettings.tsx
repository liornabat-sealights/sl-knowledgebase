
import React, { useEffect, useRef } from 'react';

// Hooks
import { useKnowledgeBase } from './hooks/useKnowledgeBase';
import { useDocuments } from './hooks/useDocuments';
import { usePagination } from './hooks/usePagination';

// Utils
import { filterDocuments } from './utils/filters';

// Components
import KbHeader from './components/KbHeader';
import KbDocumentSection from './components/KbDocumentSection';
import KbModals from './components/KbModals';

const KnowledgeBaseSettings: React.FC = () => {
  // Knowledge base state and operations
  const {
    kbStatus,
    docs,
    loading,
    refreshing,
    indexing,
    resetting,
    refreshStatus,
    handleIndexKnowledgeBase,
    handleResetKnowledgeBase,
    fetchKnowledgeBase
  } = useKnowledgeBase();

  // Document operations
  const {
    handleDeleteDocument,
    handleViewDocument,
    handleViewKnowledgeBaseGraph,
    handleFileUpload,
    searchQuery,
    setSearchQuery,
    docModal,
    graphModal,
    closeDocModal,
    closeGraphModal
  } = useDocuments(fetchKnowledgeBase);

  // Document count
  const documentCount = Object.keys(docs).length;

  // Filtered documents
  const filteredDocuments = filterDocuments(docs, searchQuery);

  // Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

  // Auto-refresh interval reference
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginatedItems: currentPageDocs,
    totalPages,
    showingFrom,
    showingTo
  } = usePagination(filteredDocuments);

  // Check if buttons should be disabled
  const isIndexing = kbStatus === 'Indexing' || indexing;
  const hasDocuments = documentCount > 0;

  // Set up auto-refresh when indexing starts
  useEffect(() => {
    // Start auto-refresh if indexing
    if (isIndexing && !refreshIntervalRef.current) {
      refreshIntervalRef.current = setInterval(() => {
        refreshStatus();
      }, 5000);
    }
    // Clear interval when not indexing
    else if (!isIndexing && refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isIndexing, refreshStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchKnowledgeBase();
  }, [fetchKnowledgeBase]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 overflow-y-auto">
      {/* Header Section */}
      <KbHeader
        kbStatus={kbStatus}
        documentCount={documentCount}
        refreshing={refreshing}
        indexing={indexing}
        resetting={resetting}
        isIndexing={isIndexing}
        hasDocuments={hasDocuments}
        refreshStatus={refreshStatus}
        handleIndexKnowledgeBase={handleIndexKnowledgeBase}
        handleResetKnowledgeBase={handleResetKnowledgeBase}
        handleViewKnowledgeBaseGraph={handleViewKnowledgeBaseGraph}
        setIsUploadModalOpen={setIsUploadModalOpen}
      />

      {/* Document Management Section */}
      <KbDocumentSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredDocuments={filteredDocuments}
        loading={loading}
        isIndexing={isIndexing}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        showingFrom={showingFrom}
        showingTo={showingTo}
        currentPageDocs={currentPageDocs}
        setCurrentPage={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
        handleViewDocument={handleViewDocument}
        handleDeleteDocument={handleDeleteDocument}
      />

      {/* Modals */}
      <KbModals
        isUploadModalOpen={isUploadModalOpen}
        setIsUploadModalOpen={setIsUploadModalOpen}
        handleFileUpload={handleFileUpload}
        docModal={docModal}
        graphModal={graphModal}
        closeDocModal={closeDocModal}
        closeGraphModal={closeGraphModal}
      />
    </div>
  );
};

export default KnowledgeBaseSettings;
