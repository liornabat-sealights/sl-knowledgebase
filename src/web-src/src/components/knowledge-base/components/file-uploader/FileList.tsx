
import React from 'react';
import { Button } from '@/ui/button';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  onRemove,
  disabled = false
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
      <div className="max-h-40 overflow-y-auto mb-4 bg-secondary/10 rounded-md p-2">
        {files.map((file, index) => (
          <div key={index} className="flex justify-between items-center py-1 px-2 hover:bg-secondary/20 rounded">
            <span className="text-sm truncate">{file.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              disabled={disabled}
            >
              &times;
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
