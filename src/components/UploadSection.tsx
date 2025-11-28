
import React, { useCallback } from 'react';
import { Camera, CheckCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';

interface UploadSectionProps {
  mediaType: 'vinyl' | 'cd';
  uploadedFiles: string[] | File[];
  onFileUploaded?: (file: string) => void;
  onFileSelected?: (file: File) => void; // New: for local-only mode
  skipUpload?: boolean; // New: skip Supabase upload
  isAnalyzing: boolean;
  onBack?: () => void;
  onReset?: () => void;
}

export const UploadSection = React.memo(({ 
  mediaType, 
  uploadedFiles, 
  onFileUploaded,
  onFileSelected,
  skipUpload = false,
  isAnalyzing,
  onBack,
  onReset
}: UploadSectionProps) => {
  const requiredPhotos = mediaType === 'vinyl' ? 3 : mediaType === 'cd' ? 4 : 0;
  const isComplete = requiredPhotos > 0 && uploadedFiles.length >= requiredPhotos;

  const getPhotoLabels = () => {
    if (mediaType === 'vinyl') {
      return ['Cover foto', 'Achterkant foto', 'Matrix/Label foto'];
    }
    if (mediaType === 'cd') {
      return ['Voor foto', 'Achterkant foto', 'Barcode foto', 'Matrix foto'];
    }
    return [];
  };

  const steps = getPhotoLabels();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card variant="dark" aria-live="polite" aria-busy={isAnalyzing}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center text-card-dark-foreground">
            <Camera className="h-6 w-6" />
            Upload {(mediaType ? mediaType.toUpperCase() : '')} foto's
            {isComplete && <CheckCircle className="h-5 w-5 text-success ml-2" />}
          </CardTitle>
          <CardDescription className="text-card-dark-foreground/70">
            {requiredPhotos > 0 ? (
              <>Upload {requiredPhotos} foto's voor analyse: {getPhotoLabels().join(', ')}</>
            ) : (
              <>Selecteer eerst een mediatype</>
            )}
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
                onFileSelected={onFileSelected}
                skipUpload={skipUpload}
                isCompleted={uploadedFiles.length > index}
              />
            ))}
          </div>
          {requiredPhotos > 0 && (
            <div className="mt-6">
              <div className="text-sm text-card-dark-foreground/70 mb-2">
                Voortgang: {uploadedFiles.length}/{requiredPhotos} foto's {skipUpload ? 'geselecteerd' : 'geüpload'}
              </div>
              <div className="w-full bg-muted/20 rounded-full h-2 border border-muted/30">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(uploadedFiles.length / requiredPhotos) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={onBack}
            disabled={isAnalyzing}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar keuze
          </Button>
        )}
        {onReset && uploadedFiles.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={onReset}
            disabled={isAnalyzing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset foto's
          </Button>
        )}
      </div>
    </div>
  );
});

UploadSection.displayName = 'UploadSection';
