
import { useState } from 'react';

export const useFileUpload = (onFileUpload: (file: File) => Promise<void>) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const handleFilesSelection = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setCurrentFileIndex(0);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentFileIndex(i);
        const progress = Math.round(((i) / selectedFiles.length) * 100);
        setUploadProgress(progress);
        
        await onFileUpload(selectedFiles[i]);
      }
      
      setUploadProgress(100);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return {
    selectedFiles,
    uploading,
    uploadProgress,
    currentFileIndex,
    handleFilesSelection,
    handleUpload,
    removeFile
  };
};
