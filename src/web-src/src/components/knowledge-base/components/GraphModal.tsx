
import React from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '@/ui/modal';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  loading: boolean;
  error: string | null;
}

const GraphModal: React.FC<GraphModalProps> = ({
  isOpen,
  onClose,
  content,
  loading,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Knowledge Base Graph"
      className="max-w-5xl"
    >
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : (
        <iframe
          srcDoc={content}
          className="w-full h-[70vh] border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Knowledge Base Graph"
        />
      )}
    </Modal>
  );
};

export default GraphModal;
