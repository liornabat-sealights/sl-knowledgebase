
import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processItems } from './fileUtils';

// Create extended input props interface to handle directory attributes
interface ExtendedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFilesCount: number;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  onFilesSelected,
  selectedFilesCount
}) => {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    // Process dropped items (files and directories)
    processItems(items).then(files => {
      onFilesSelected(files);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      // Filter for supported file types
      const supportedFiles = fileArray.filter(file => 
        /\.(pdf|txt|md|doc|docx)$/i.test(file.name)
      );
      onFilesSelected(supportedFiles);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".txt,.md"
        multiple
        // Use a type assertion to apply non-standard attributes
        {...{ webkitdirectory: "", directory: "" } as ExtendedInputProps}
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <Database className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">
          {selectedFilesCount > 0 
            ? `Selected: ${selectedFilesCount} files` 
            : 'Drop files or folders here'
          }
        </p>
        <p className="text-xs text-muted-foreground">
          Supports multiple documents: .txt, .md
        </p>
      </div>
    </div>
  );
};
