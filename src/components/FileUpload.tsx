import React, { useRef, useState } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  step: number;
  stepTitle: string;
  stepDescription: string;
  onFileUploaded?: (url: string) => void;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  step,
  stepTitle,
  stepDescription,
  onFileUploaded,
  accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const { uploading, uploadFile, addFile } = useFileUpload();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum 10MB toegestaan.');
      return;
    }

    // Add file to preview
    addFile(file);
    
    // Upload file
    const url = await uploadFile(file, step);
    if (url) {
      setUploadedUrl(url);
      onFileUploaded?.(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeUpload = () => {
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Stap {step}: {stepTitle}</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {stepDescription}
          </p>
        </div>

        {uploadedUrl ? (
          // Success state
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-green-800 dark:text-green-200">
                    Foto succesvol geüpload!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Stap {step} voltooid
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={removeUpload}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Andere foto kiezen
              </Button>
              <Button 
                onClick={() => window.open(uploadedUrl, '_blank')}
                className="flex-1"
              >
                Bekijk foto
              </Button>
            </div>
          </div>
        ) : (
          // Upload state
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/20 hover:border-primary/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-lg font-medium">Foto wordt geüpload...</p>
                  <p className="text-sm text-muted-foreground">
                    Even geduld alstublieft
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">
                    Sleep een foto hierheen of klik om te uploaden
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ondersteunde formaten: JPG, PNG, HEIC (max 10MB)
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={openFileDialog}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Kies Foto
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};