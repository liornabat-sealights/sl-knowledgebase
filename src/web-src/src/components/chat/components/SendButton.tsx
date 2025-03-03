
import React from 'react';
import { Button } from '@/ui/button.tsx';
import { ArrowUpIcon, StopCircle } from 'lucide-react';

interface SendButtonProps {
  isTyping: boolean;
  disabled: boolean;
  onClick: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({ isTyping, disabled, onClick }) => {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full h-10 w-10 flex items-center justify-center shrink-0 transition-all ${isTyping ? 'bg-red-500 hover:bg-red-600' : ''}`}
      style={{ padding: 0 }}
    >
      {isTyping ? (
        <StopCircle size={26} style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px' }} className="text-primary-foreground" />
      ) : (
        <ArrowUpIcon size={26} style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px' }} className="text-primary-foreground" />
      )}
      <span className="sr-only">{isTyping ? "Stop generation" : "Send message"}</span>
    </Button>
  );
};

export default SendButton;
