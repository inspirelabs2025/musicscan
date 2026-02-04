import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MatrixUploadStepProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function MatrixUploadStep({ onFileSelect, className }: MatrixUploadStepProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };
    input.click();
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">CD Matrix Enhancer</h2>
        <p className="text-muted-foreground">
          Upload een foto van de CD binnenring om de matrix codes te lezen
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-muted/50',
              isDragActive && 'border-primary bg-muted/50',
              isDragReject && 'border-destructive bg-destructive/10'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-4">
              {isDragReject ? (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-destructive font-medium">
                    Alleen afbeeldingen toegestaan
                  </p>
                </>
              ) : isDragActive ? (
                <>
                  <Upload className="h-12 w-12 text-primary animate-bounce" />
                  <p className="text-primary font-medium">
                    Laat los om te uploaden
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      Sleep een afbeelding hierheen
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of klik om een bestand te selecteren
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-border" />
              <span className="text-sm text-muted-foreground">of</span>
              <div className="h-px w-12 bg-border" />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={handleCameraCapture}
          >
            <Camera className="h-4 w-4" />
            Maak een foto
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Tips voor de beste resultaten
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Fotografeer de binnenring van de CD dichtbij (waar de matrix codes staan)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Gebruik schuin licht om reflecties te verminderen</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Houd de camera stabiel voor een scherpe foto</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>De gegraveerde tekst is meestal in de transparante ring rond de hub</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
