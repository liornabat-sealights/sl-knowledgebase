import React from 'react';
import {Sparkles, RotateCcw, Settings, Settings2} from 'lucide-react';
import { Button } from '@/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select.tsx';
import StatusIndicator, { StatusType } from './StatusIndicator.tsx';
import { Link } from 'react-router-dom';

// LLM Models available
const llmModels = [
  { name: "GPT-4o", value: "GPT-4o" },
  { name: "GPT-4o Mini", value: "GPT-4o Mini" },
  { name: "o1", value: "o1" },
  { name: "o1 Mini", value: "o1-mini" },
  { name: "o3 Mini", value: "o3-mini" },
];

interface ChatHeaderProps {
  kbStatus: StatusType;
  selectedLLM: string;
  onLLMChange: (value: string) => void;
  onClearChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
                                                 kbStatus,
                                                 selectedLLM,
                                                 onLLMChange,
                                                 onClearChat
                                               }) => {
  return (
      <div className="w-full mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <h1 className="font-medium text-2xl">Knowledge Base Chat</h1>
          <StatusIndicator status={kbStatus} />
        </div>

        <div className="flex items-center gap-2">
          <Select
              value={selectedLLM}
              onValueChange={onLLMChange}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              {llmModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearChat}
                    className="flex items-center gap-1 h-8"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear all chat messages
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1 h-8"
                    asChild
                >
                  <Link to="/settings">
                    <Settings2 className="h-4 w-4" />
                    Manage
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Knowledge Base Management
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
  );
};

export default ChatHeader;