import React, { useCallback, useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileOptimizedUploadProps {
  onFileUploaded: (url: string) => void;
  uploadedFiles: string[];
  requiredPhotos: number;
  photoLabels: string[];
  isAnalyzing: boolean;
}

export const MobileOptimizedUpload: React.FC<MobileOptimizedUploadProps> = ({
  onFileUploaded,
  uploadedFiles,
  requiredPhotos,
  photoLabels,
  isAnalyzing
}) => {
  const { isMobile, connection, screenSize } = useMobileDetection();
  const [compressionLevel, setCompressionLevel] = useState<number>(isMobile ? 0.7 : 0.9);
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal size for mobile
        const maxWidth = isMobile ? 1200 : 1920;
        const maxHeight = isMobile ? 1200 : 1920;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', compressionLevel);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [isMobile, compressionLevel]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (isUploading) return;
    
    setIsUploading(true);
    
    try {
      // Compress image for mobile
      const processedFile = isMobile ? await compressImage(file) : file;
      
      // Upload to Supabase storage
      const formData = new FormData();
      formData.append('file', processedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      onFileUploaded(url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [isMobile, compressImage, onFileUploaded, isUploading]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Mobile optimization notice */}
          {isMobile && (
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                Mobile detected. Images will be compressed for faster upload.
                {connection === 'slow' && ' Slow connection detected - using high compression.'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Upload progress */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Foto's: {uploadedFiles.length}/{requiredPhotos}
            </span>
            <Badge variant={uploadedFiles.length >= requiredPhotos ? 'default' : 'secondary'}>
              {uploadedFiles.length >= requiredPhotos ? 'Compleet' : 'Bezig'}
            </Badge>
          </div>
          
          {/* Upload buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photoLabels.map((label, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isUploading || isAnalyzing || uploadedFiles.length > index}
                  />
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2"
                    disabled={isUploading || isAnalyzing || uploadedFiles.length > index}
                  >
                    {isUploading && uploadedFiles.length === index ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : uploadedFiles.length > index ? (
                      <div className="text-center">
                        <div className="text-green-600">✓</div>
                        <span className="text-xs">Geüpload</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Upload</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Mobile tips */}
          {isMobile && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Tips voor mobiele uploads:</p>
              <ul className="ml-4 space-y-1">
                <li>• Zorg voor goed licht</li>
                <li>• Houd camera stabiel</li>
                <li>• Vermijd reflecties</li>
                <li>• Gebruik WiFi indien mogelijk</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};