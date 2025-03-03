
import { useState, useEffect, useRef } from 'react';
import { StatusType } from '../components/StatusIndicator.tsx';
import { apiService } from '@/services/ApiService.ts';

export const useStatusCheck = () => {
  const [kbStatus, setKbStatus] = useState<StatusType>('Unknown');
  const isFetchingRef = useRef(false);

  // Function to fetch knowledge base status
  const fetchKnowledgeBaseStatus = async () => {
    // If we're currently fetching, don't proceed
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const response = await apiService.getKnowledgeBaseStatus();

      // Set the knowledge base status based on the successful response
      if (response.status) {
        setKbStatus(response.message as StatusType);
      } else {
        // If the API returns success but no status, assume it's 'Ready'
        setKbStatus('Ready');
      }
    } catch (error) {
      console.error("Error getting knowledge base status:", error);

      // If we get a network error, mark as offline
      if (error instanceof Error && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network Error')
      )) {
        console.log("API appears to be offline, setting offline status");
        setKbStatus('Offline');
      } else {
        // For other errors, we're still connected but there's an issue
        console.error("Error fetching knowledge base status:", error);
        // Set status to 'Not Ready' for other types of errors
        setKbStatus('Not Ready');
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Set up polling for status - consistent 10 second interval
  useEffect(() => {
    // Immediate first check
    fetchKnowledgeBaseStatus();

    // Set up interval for regular checks every 10 seconds without backoff
    const intervalId = setInterval(() => {
      fetchKnowledgeBaseStatus();
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return { kbStatus };
};
