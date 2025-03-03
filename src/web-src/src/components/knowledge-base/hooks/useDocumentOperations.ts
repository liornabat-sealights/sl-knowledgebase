
import { useCallback } from 'react';
import { apiService } from '@/services/ApiService';
import { useToast } from '@/hooks/use-toast';

export function useDocumentOperations(onDocumentChange: () => Promise<void>) {
  const { toast } = useToast();
  
  // Handle document deletion
  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      await apiService.deleteDocument(id);
      toast({
        title: "Document deleted",
        description: "The document was successfully deleted.",
      });
      await onDocumentChange();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error deleting document",
        description: "There was an error deleting the document. Please try again.",
        variant: "destructive",
      });
    }
  }, [onDocumentChange, toast]);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      await apiService.addDocument(file);
      toast({
        title: "Document uploaded",
        description: "The document was successfully uploaded.",
      });
      await onDocumentChange();
      return Promise.resolve();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error uploading document",
        description: "There was an error uploading the document. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  }, [onDocumentChange, toast]);
  
  return {
    handleDeleteDocument,
    handleFileUpload,
  };
}
