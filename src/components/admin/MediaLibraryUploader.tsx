import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaLibraryUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
}

export const MediaLibraryUploader = ({ onUpload, isUploading }: MediaLibraryUploaderProps) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 50,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-primary/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-muted-foreground">Uploading...</p>
          </>
        ) : isDragActive ? (
          <>
            <ImageIcon className="h-10 w-10 text-primary" />
            <p className="text-primary font-medium">Drop foto's hier...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop foto's hier of klik om te uploaden</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ondersteunt meerdere bestanden (max 50)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
