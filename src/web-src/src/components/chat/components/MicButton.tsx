
import React from 'react';
import { Button } from '@/ui/button.tsx';
import { MicIcon, StopCircle } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  recordingTime: number;
  formatTime: (seconds: number) => string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled: boolean;
}

const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  recordingTime,
  formatTime,
  onStartRecording,
  onStopRecording,
  disabled
}) => {
  return (
    <Button
      type="button"
      size="icon"
      variant={isRecording ? "destructive" : "outline"}
      onClick={isRecording ? onStopRecording : onStartRecording}
      disabled={disabled}
      className="rounded-full h-10 w-10 flex items-center justify-center shrink-0 transition-all"
      style={{ padding: 0 }}
    >
      {isRecording ? (
        <StopCircle size={26} style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px' }} />
      ) : (
        <MicIcon size={26} style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px' }} />
      )}
      <span className="sr-only">
        {isRecording ? `Stop recording (${formatTime(recordingTime)})` : "Start recording"}
      </span>
    </Button>
  );
};

export default MicButton;
