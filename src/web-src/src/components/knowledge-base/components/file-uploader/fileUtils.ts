
export const processItems = async (items: DataTransferItemList): Promise<File[]> => {
  const promises: Promise<File[]>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      // Handle directory entries if webkitGetAsEntry is available
      const entry = item.webkitGetAsEntry?.();
      
      if (entry && entry.isDirectory) {
        promises.push(processDirectory(entry as any));
      } else {
        // Process file
        const file = item.getAsFile();
        if (file) promises.push(Promise.resolve([file]));
      }
    }
  }

  const fileArrays = await Promise.all(promises);
  // Flatten the array of arrays into a single array of files
  const files = fileArrays.flat();
  // Filter out unsupported file types
  const supportedFiles = files.filter(file => 
    /\.(txt|md)$/i.test(file.name)
  );
  
  return supportedFiles;
};

export const processDirectory = async (entry: any): Promise<File[]> => {
  const reader = entry.createReader();
  const files: File[] = [];

  // Function to read entries recursively
  const readEntries = async (): Promise<void> => {
    return new Promise((resolve) => {
      reader.readEntries(async (entries: any[]) => {
        if (entries.length === 0) {
          resolve();
          return;
        }

        for (const entry of entries) {
          if (entry.isFile) {
            const file = await getFileFromEntry(entry);
            if (file) files.push(file);
          } else if (entry.isDirectory) {
            const dirFiles = await processDirectory(entry);
            files.push(...dirFiles);
          }
        }

        // Continue reading if there are more entries
        await readEntries();
      });
    });
  };

  await readEntries();
  return files;
};

export const getFileFromEntry = (entry: any): Promise<File | null> => {
  return new Promise((resolve) => {
    entry.file((file: File) => {
      resolve(file);
    }, () => {
      resolve(null);
    });
  });
};
