
import React from 'react';
import { ArrowLeft, RefreshCw, Database, Trash2, Network, Upload } from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import StatusIndicator, { StatusType } from '@/components/chat/components/StatusIndicator';
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
} from "@/ui/alert-dialog";

interface KbHeaderProps {
  kbStatus: StatusType;
  documentCount: number;
  refreshing: boolean;
  indexing: boolean;
  resetting: boolean;
  isIndexing: boolean;
  hasDocuments: boolean;
  refreshStatus: () => Promise<void>;
  handleIndexKnowledgeBase: () => Promise<void>;
  handleResetKnowledgeBase: () => Promise<void>;
  handleViewKnowledgeBaseGraph: () => Promise<void>;
  setIsUploadModalOpen: (isOpen: boolean) => void;
}

const KbHeader: React.FC<KbHeaderProps> = ({
  kbStatus,
  documentCount,
  refreshing,
  indexing,
  resetting,
  isIndexing,
  hasDocuments,
  refreshStatus,
  handleIndexKnowledgeBase,
  handleResetKnowledgeBase,
  handleViewKnowledgeBaseGraph,
  setIsUploadModalOpen
}) => {
  return (
    <div className="w-full mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="mr-1">
          <Link to="/chat">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to chat</span>
          </Link>
        </Button>
        <h1 className="font-medium text-2xl">Knowledge Base Management</h1>
        <div className="flex items-center gap-2">
          <StatusIndicator status={kbStatus} />
          {documentCount > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {documentCount} {documentCount === 1 ? 'Document' : 'Documents'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStatus}
                disabled={refreshing}
                className="flex items-center gap-1 h-8"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Refresh Knowledge Base Status
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewKnowledgeBaseGraph}
                disabled={isIndexing || !hasDocuments}
                className="flex items-center gap-1 h-8"
              >
                <Network className="h-4 w-4" />
                Graph
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View Knowledge Base Graph
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isIndexing}
                className="flex items-center gap-1 h-8"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Upload Documents to Knowledge Base
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              disabled={isIndexing || !hasDocuments}
              className="flex items-center gap-1 h-8"
            >
              {indexing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {indexing ? 'Indexing...' : 'Index'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Index Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to index the knowledge base?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleIndexKnowledgeBase}
              >
                Yes, Index
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isIndexing || !hasDocuments}
              className="flex items-center gap-1 h-8"
            >
              {resetting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {resetting ? 'Resetting...' : 'Reset'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset the knowledge base? This will delete all documents.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetKnowledgeBase}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default KbHeader;
