
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/ui/button';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';

// Components
import SearchBar from './SearchBar';
import DocumentTable from './DocumentTable';
import PaginationControls from './PaginationControls';
import EmptyState from './EmptyState';

interface KbDocumentSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredDocuments: KnowledgeBaseDocModel[];
  loading: boolean;
  isIndexing: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  showingFrom: number;
  showingTo: number;
  currentPageDocs: KnowledgeBaseDocModel[];
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  handleViewDocument: (doc: KnowledgeBaseDocModel) => void;
  handleDeleteDocument: (id: string) => void;
}

const KbDocumentSection: React.FC<KbDocumentSectionProps> = ({
  searchQuery,
  setSearchQuery,
  filteredDocuments,
  loading,
  isIndexing,
  currentPage,
  totalPages,
  itemsPerPage,
  showingFrom,
  showingTo,
  currentPageDocs,
  setCurrentPage,
  setItemsPerPage,
  handleViewDocument,
  handleDeleteDocument
}) => {
  return (
    <div className="bg-secondary/30 rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg font-medium">Documents List</h2>

        <div className="w-full md:w-auto flex items-center space-x-2">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>
      </div>

      {/* Search Results Notification */}
      {searchQuery && (
        <div className="bg-primary/10 text-primary border border-primary/20 rounded-md px-3 py-2 mb-4 text-sm flex justify-between items-center">
          <span>
            Showing results for: <strong>{searchQuery}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSearchQuery('')}
          >
            Clear filter
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length > 0 ? (
        <>
          <DocumentTable
            documents={currentPageDocs}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onView={handleViewDocument}
            onDelete={handleDeleteDocument}
            {...(isIndexing && { isIndexing })} // Only add the prop if it's indexing
          />

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalItems={filteredDocuments.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      ) : (
        <EmptyState
          hasSearchQuery={!!searchQuery}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default KbDocumentSection;
