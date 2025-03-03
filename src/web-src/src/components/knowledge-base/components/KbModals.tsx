import React from 'react';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';
import Modal from '@/ui/modal';
import FileUploader from './file-uploader';
import DocumentModal from './DocumentModal';
import GraphModal from './GraphModal';
import { DocumentModalState } from '../hooks/useDocumentModal';
import { GraphModalState } from '../hooks/useGraphModal';

interface KbModalsProps {
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (isOpen: boolean) => void;
  handleFileUpload: (file: File) => Promise<void>;
  docModal: DocumentModalState;
  graphModal: GraphModalState;
  closeDocModal: () => void;
  closeGraphModal: () => void;
}

const KbModals: React.FC<KbModalsProps> = ({
  isUploadModalOpen,
  setIsUploadModalOpen,
  handleFileUpload,
  docModal,
  graphModal,
  closeDocModal,
  closeGraphModal
}) => {
  return (
    <>
      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Documents"
        className="max-w-2xl"
      >
        <FileUploader
          onFileUpload={async (file) => {
            await handleFileUpload(file);
            setIsUploadModalOpen(false);
          }}
        />
      </Modal>

      {/* Document Modal */}
      <DocumentModal
        isOpen={docModal.isOpen}
        onClose={closeDocModal}
        doc={docModal.doc}
        content={docModal.content}
        loading={docModal.loading}
        error={docModal.error}
      />

      {/* Graph Modal */}
      <GraphModal
        isOpen={graphModal.isOpen}
        onClose={closeGraphModal}
        content={graphModal.content}
        loading={graphModal.loading}
        error={graphModal.error}
      />
    </>
  );
};

export default KbModals;
