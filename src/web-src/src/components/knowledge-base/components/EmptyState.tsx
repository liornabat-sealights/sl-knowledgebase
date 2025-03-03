
import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  hasSearchQuery: boolean;
  searchQuery?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasSearchQuery, searchQuery }) => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>
        {hasSearchQuery
          ? 'No documents match your search.'
          : 'No documents found in the knowledge base.'}
      </p>
      <p className="text-sm">
        {hasSearchQuery
          ? 'Try a different search term.'
          : 'Upload documents to get started.'}
      </p>
    </div>
  );
};

export default EmptyState;
