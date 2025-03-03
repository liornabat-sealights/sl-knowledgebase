
import React from 'react';
import { Progress } from '@/ui/progress';

interface UploadProgressProps {
  currentFileIndex: number;
  totalFiles: number;
  progress: number;
  fileName?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  currentFileIndex,
  totalFiles,
  progress,
  fileName
}) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm mb-1">
        <span>Uploading: {currentFileIndex + 1} of {totalFiles}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      {fileName && (
        <p className="text-xs mt-1 text-muted-foreground">
          {fileName}
        </p>
      )}
    </div>
  );
};
