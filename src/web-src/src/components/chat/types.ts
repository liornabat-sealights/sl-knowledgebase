import { StatusType } from './components/StatusIndicator.tsx';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  responseTime?: number;
  previousQuery?: string;
  isError?: boolean;
  isHistory?: boolean;
  contextMessageId?: string; // ID of the message this is replying to
  // Single reply context (keeping for backward compatibility)
  replyContext?: {
    content: string;
    timestamp: Date;
    isUser: boolean;
  };
  // New property for multiple reply contexts
  replyContexts?: Array<{
    content: string;
    timestamp: Date;
    isUser: boolean;
  }>;
}

export interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
}

// Define the possible statuses and their colors
export const statusColors: Record<StatusType, string> = {
  'Unknown': 'bg-gray-400 text-white',
  'Init': 'bg-blue-500 text-white',
  'Ready': 'bg-green-500 text-white',
  'Not Ready': 'bg-red-500 text-white',
  'Updating': 'bg-yellow-500 text-white',
  'Indexing': 'bg-yellow-500 text-white',
  'Empty': 'bg-blue-200 text-blue-800',
  'Not Indexed': 'bg-yellow-400 text-yellow-900',
  'In Progress': 'bg-blue-500 text-white',
  'Indexed': 'bg-green-500 text-white',
  'Index Failed': 'bg-red-500 text-white',
  'Offline': 'bg-red-500 text-white',
  'Error': 'bg-red-500 text-white'
};
