
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/ui/button';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { useFileUpload } from './useFileUpload';

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const {
    selectedFiles,
    uploading,
    uploadProgress,
    currentFileIndex,
    handleFilesSelection,
    handleUpload,
    removeFile
  } = useFileUpload(onFileUpload);

  return (
    <div className="mb-6">
      <DropZone 
        onFilesSelected={handleFilesSelection}
        selectedFilesCount={selectedFiles.length}
      />

      {selectedFiles.length > 0 && (
        <FileList 
          files={selectedFiles}
          onRemove={removeFile}
          disabled={uploading}
        />
      )}

      {uploading && (
        <UploadProgress
          currentFileIndex={currentFileIndex}
          totalFiles={selectedFiles.length}
          progress={uploadProgress}
          fileName={selectedFiles[currentFileIndex]?.name}
        />
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Document' : 'Documents'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
