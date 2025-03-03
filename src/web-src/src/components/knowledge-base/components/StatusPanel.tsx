
import React from 'react';
import { RefreshCw, Database, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/ui/button.tsx';
import StatusIndicator, { StatusType } from '@/components/chat/components/StatusIndicator.tsx';
import { cn } from '@/lib/utils.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog.tsx";

interface StatusPanelProps {
  status: StatusType;
  documentCount: number;
  onRefresh: () => void;
  onIndex: () => void;
  onReset: () => void;
  onViewGraph: () => void;
  isRefreshing: boolean;
  isIndexing: boolean;
  isResetting: boolean;
  loading: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  status,
  documentCount,
  onRefresh,
  onIndex,
  onReset,
  onViewGraph,
  isRefreshing,
  isIndexing,
  isResetting,
  loading
}) => {
  return (
    <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Knowledge Base Status</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center space-x-3">
        <StatusIndicator status={status} className="text-sm px-3 py-1" />
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {documentCount} Documents
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          onClick={onIndex}
          disabled={isIndexing || status === 'Indexing'}
          className="flex items-center gap-2"
        >
          {isIndexing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {isIndexing ? 'Indexing...' : 'Index Knowledge Base'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              disabled={isResetting}
            >
              {isResetting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isResetting ? 'Resetting...' : 'Reset Knowledge Base'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all documents and indices from the knowledge base.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onViewGraph}
        >
          <BarChart3 className="h-4 w-4" />
          View Knowledge Base Graph
        </Button>
      </div>
    </div>
  );
};

export default StatusPanel;
