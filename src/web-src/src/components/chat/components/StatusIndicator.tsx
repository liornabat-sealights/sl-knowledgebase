
import React from 'react';
import { cn } from '@/lib/utils.ts';
import { CheckCircle, AlertCircle, HelpCircle, XCircle, Loader2, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip.tsx';

export type StatusType = 
  | 'Unknown' 
  | 'Empty' 
  | 'Ready' 
  | 'Not Ready' 
  | 'Indexing' 
  | 'Not Indexed' 
  | 'In Progress' 
  | 'Indexed' 
  | 'Index Failed'
  | 'Updating'
  | 'Offline'
  | 'Error'
  | 'Init';

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
  tooltip?: string;
  showLabel?: boolean;
}

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'Unknown':
      return { 
        color: 'bg-gray-400 text-white', 
        icon: HelpCircle 
      };
    case 'Empty':
      return { 
        color: 'bg-blue-200 text-blue-800', 
        icon: HelpCircle 
      };
    case 'Ready':
      return { 
        color: 'bg-green-500 text-white', 
        icon: CheckCircle 
      };
    case 'Not Ready':
      return { 
        color: 'bg-red-500 text-white', 
        icon: AlertCircle 
      };
    case 'Indexing':
    case 'Updating':
      return { 
        color: 'bg-yellow-500 text-white', 
        icon: Loader2,
        animate: 'animate-spin' 
      };
    case 'Init':
      return { 
        color: 'bg-blue-500 text-white', 
        icon: Loader2,
        animate: 'animate-spin' 
      };
    case 'Not Indexed':
      return { 
        color: 'bg-yellow-400 text-yellow-900', 
        icon: AlertCircle 
      };
    case 'In Progress':
      return { 
        color: 'bg-blue-500 text-white', 
        icon: Loader2,
        animate: 'animate-spin' 
      };
    case 'Indexed':
      return { 
        color: 'bg-green-500 text-white', 
        icon: CheckCircle 
      };
    case 'Index Failed':
      return { 
        color: 'bg-red-500 text-white', 
        icon: XCircle 
      };
    case 'Offline':
      return { 
        color: 'bg-red-500 text-white', 
        icon: WifiOff 
      };
    case 'Error':
      return {
        color: 'bg-red-500 text-white',
        icon: AlertCircle
      };
    default:
      return { 
        color: 'bg-gray-400 text-white', 
        icon: HelpCircle 
      };
  }
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  className, 
  tooltip,
  showLabel = true 
}) => {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  const indicator = (
    <div 
      className={cn(
        "flex items-center gap-1.5 rounded-full",
        showLabel ? "px-2 py-0.5" : "p-1",
        config.color,
        className
      )}
    >
      <IconComponent className={cn("h-3.5 w-3.5", config.animate)} />
      {showLabel && <span className="text-[10px] font-medium">{status}</span>}
    </div>
  );
  
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return indicator;
};

export default StatusIndicator;
