
import React, { useCallback } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';

interface UploadSectionProps {
  mediaType: 'vinyl' | 'cd';
  uploadedFiles: string[];
  onFileUploaded: (file: string) => void;
  isAnalyzing: boolean;
}

export const UploadSection = React.memo(({ 
  mediaType, 
  uploadedFiles, 
  onFileUploaded, 
  isAnalyzing 
}: UploadSectionProps) => {
  const requiredPhotos = mediaType === 'vinyl' ? 3 : 4;
  const isComplete = uploadedFiles.length >= requiredPhotos;

  const getPhotoLabels = () => {
    if (mediaType === 'vinyl') {
      return ['Cover foto', 'Achterkant foto', 'Matrix/Label foto'];
    }
    return ['Voor foto', 'Achterkant foto', 'Barcode foto', 'Matrix foto'];
  };

  const steps = getPhotoLabels();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card variant="dark">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center text-card-dark-foreground">
            <Camera className="h-6 w-6" />
            Upload {mediaType.toUpperCase()} foto's
            {isComplete && <CheckCircle className="h-5 w-5 text-success ml-2" />}
          </CardTitle>
          <CardDescription className="text-card-dark-foreground/70">
            Upload {requiredPhotos} foto's voor analyse: {getPhotoLabels().join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((label, index) => (
              <FileUpload
                key={index}
                step={index + 1}
                stepTitle={label}
                stepDescription={`Upload de ${label.toLowerCase()}`}
                onFileUploaded={onFileUploaded}
                isCompleted={uploadedFiles.length > index}
              />
            ))}
          </div>
          <div className="mt-6">
            <div className="text-sm text-card-dark-foreground/70 mb-2">
              Voortgang: {uploadedFiles.length}/{requiredPhotos} foto's geüpload
            </div>
            <div className="w-full bg-muted/20 rounded-full h-2 border border-muted/30">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(uploadedFiles.length / requiredPhotos) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

UploadSection.displayName = 'UploadSection';
