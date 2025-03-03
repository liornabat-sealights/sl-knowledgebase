
import React from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '@/ui/modal';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';
import Markdown from 'react-markdown';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: KnowledgeBaseDocModel | null;
  content: string;
  loading: boolean;
  error: string | null;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  doc,
  content,
  loading,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc?.file_name || 'Document Content'}
      className="max-w-6xl"
    >
      {doc && (
        <div className="space-y-4">
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                {error}
              </div>
            ) : (
              <div className="bg-secondary/50 p-4 rounded-md overflow-auto max-h-[70vh] prose prose-sm dark:prose-invert">
                <Markdown>{content}</Markdown>
              </div>
            )}
          </div>

          {doc.error && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2 text-destructive">Error</h3>
              <div className="bg-destructive/10 text-destructive p-4 rounded-md whitespace-pre-wrap">
                {doc.error}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DocumentModal;
