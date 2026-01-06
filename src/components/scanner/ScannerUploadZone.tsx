import React, { useCallback, useRef, useState } from 'react';
import { Upload, Camera, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScannerUploadZoneProps {
  mediaType: 'vinyl' | 'cd';
  files: File[];
  onFileAdd: (file: File) => void;
  onFileRemove: (index: number) => void;
  isAnalyzing: boolean;
  requiredCount: number;
}

const PHOTO_LABELS: Record<string, string[]> = {
  vinyl: ['Voorkant hoes', 'Achterkant hoes', 'Label (plaat)'],
  cd: ['Voorkant', 'Achterkant', 'CD Label', 'Binnenkant booklet'],
};

export const ScannerUploadZone = React.memo(({
  mediaType,
  files,
  onFileAdd,
  onFileRemove,
  isAnalyzing,
  requiredCount,
}: ScannerUploadZoneProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const labels = PHOTO_LABELS[mediaType] || PHOTO_LABELS.vinyl;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setUploadingIndex(index);
    
    // Small delay for UX
    await new Promise(r => setTimeout(r, 200));
    
    onFileAdd(file);
    setUploadingIndex(null);

    // Clear input
    if (inputRefs.current[index]) {
      inputRefs.current[index]!.value = '';
    }
  }, [onFileAdd]);

  const openFileDialog = (index: number) => {
    inputRefs.current[index]?.click();
  };

  const allUploaded = files.length >= requiredCount;
  const progress = Math.min(files.length, requiredCount);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Foto's: {progress}/{requiredCount}</span>
        {allUploaded && !isAnalyzing && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Klaar voor analyse
          </span>
        )}
        {isAnalyzing && (
          <span className="flex items-center gap-1 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Bezig met analyseren...
          </span>
        )}
      </div>

      {/* Upload grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {labels.slice(0, requiredCount).map((label, index) => {
          const hasFile = index < files.length;
          const isUploading = uploadingIndex === index;
          const file = files[index];

          return (
            <div key={label} className="relative">
              <input
                ref={el => inputRefs.current[index] = el}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileChange(e, index)}
                className="hidden"
                disabled={isAnalyzing || hasFile}
              />

              {hasFile && file ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 bg-muted">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                  {!isAnalyzing && (
                    <button
                      onClick={() => onFileRemove(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">
                    {label}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openFileDialog(index)}
                  disabled={isAnalyzing || index > files.length}
                  className={cn(
                    "aspect-square w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                    index === files.length
                      ? "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                      : "border-muted-foreground/30 bg-muted/30 cursor-not-allowed opacity-50"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <div className="flex gap-1">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground text-center px-1">
                        {label}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile tip */}
      <p className="text-xs text-muted-foreground text-center">
        📷 Tip: Gebruik de camera voor de beste resultaten
      </p>
    </div>
  );
});

ScannerUploadZone.displayName = 'ScannerUploadZone';
