import { useState, useCallback, useEffect } from 'react';
import { apiService } from '@/services/ApiService';
import { StatusType } from '@/components/chat/components/StatusIndicator.tsx';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';

interface KnowledgeBaseHookResult {
  kbStatus: StatusType;
  docs: Record<string, KnowledgeBaseDocModel>;
  loading: boolean;
  refreshing: boolean;
  indexing: boolean;
  resetting: boolean;
  refreshStatus: () => Promise<void>;
  handleIndexKnowledgeBase: () => Promise<void>;
  handleResetKnowledgeBase: () => Promise<void>;
  fetchKnowledgeBase: () => Promise<void>;
}

/**
 * Hook to manage Knowledge Base operations
 */
export function useKnowledgeBase(): KnowledgeBaseHookResult {
  const [kbStatus, setKbStatus] = useState<StatusType>('Unknown');
  const [docs, setDocs] = useState<Record<string, KnowledgeBaseDocModel>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchKnowledgeBase = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getKnowledgeBase();
      if (response.knowledge_base) {
        setDocs(response.knowledge_base.docs || {});
        setKbStatus(response.knowledge_base.status as StatusType || 'Unknown');
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await apiService.getKnowledgeBaseStatus();
      setKbStatus(response.message as StatusType || 'Unknown');
      await fetchKnowledgeBase();
    } catch (error) {
      console.error("Error refreshing status:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchKnowledgeBase]);

  const handleIndexKnowledgeBase = useCallback(async () => {
    try {
      setIndexing(true);
      setKbStatus('Indexing'); // Immediately update status to Indexing
      await apiService.indexKnowledgeBase();
      await refreshStatus();
    } catch (error) {
      console.error("Error indexing knowledge base:", error);
      setKbStatus('Error'); // Set status to Error if indexing fails
    } finally {
      setIndexing(false);
    }
  }, [refreshStatus]);

  const handleResetKnowledgeBase = useCallback(async () => {
    try {
      setResetting(true);
      await apiService.resetKnowledgeBase();
      await refreshStatus();
    } catch (error) {
      console.error("Error resetting knowledge base:", error);
    } finally {
      setResetting(false);
    }
  }, [refreshStatus]);

  return {
    kbStatus,
    docs,
    loading,
    refreshing,
    indexing,
    resetting,
    refreshStatus,
    handleIndexKnowledgeBase,
    handleResetKnowledgeBase,
    fetchKnowledgeBase,
  };
}