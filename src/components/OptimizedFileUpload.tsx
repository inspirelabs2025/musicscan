import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMobileOptimized, useMobileFileUpload } from "@/hooks/useMobileOptimized";
import { compressImage, generateThumbnail } from "@/utils/imageOptimization";
import { toast } from "@/hooks/use-toast";

interface OptimizedFileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  accept?: string;
  title?: string;
  description?: string;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  thumbnail?: string;
  compressed?: File;
  status: 'preparing' | 'compressing' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export const OptimizedFileUpload = ({
  onUpload,
  maxFiles = 5,
  accept = "image/*",
  title = "Upload bestanden",
  description = "Sleep bestanden hierheen of klik om te selecteren",
  className = ""
}: OptimizedFileUploadProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const { isMobile, platform } = useMobileOptimized();
  const { recommendedSettings, openCamera } = useMobileFileUpload();

  const canAddMore = useMemo(() => uploadFiles.length < maxFiles, [uploadFiles.length, maxFiles]);
  const completedFiles = useMemo(() => uploadFiles.filter(f => f.status === 'completed'), [uploadFiles]);
  const hasErrors = useMemo(() => uploadFiles.some(f => f.status === 'error'), [uploadFiles]);

  const processFile = useCallback(async (file: File): Promise<UploadFile> => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadFile: UploadFile = {
      file,
      id,
      status: 'preparing',
      progress: 0
    };

    // Generate thumbnail
    try {
      uploadFile.thumbnail = await generateThumbnail(file, 100);
      uploadFile.progress = 25;
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }

    // Compress image if it's too large
    uploadFile.status = 'compressing';
    uploadFile.progress = 50;
    
    try {
      if (file.size > 2 * 1024 * 1024) { // > 2MB
        uploadFile.compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          format: 'webp'
        });
      } else {
        uploadFile.compressed = file;
      }
      uploadFile.progress = 75;
    } catch (error) {
      uploadFile.compressed = file; // Use original if compression fails
    }

    uploadFile.status = 'uploading';
    uploadFile.progress = 100;

    return uploadFile;
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestand",
          description: `${file.name} is geen afbeelding`,
          variant: "destructive"
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Bestand te groot",
          description: `${file.name} is groter dan 10MB`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Check if we exceed max files
    const totalFiles = uploadFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Te veel bestanden",
        description: `Maximaal ${maxFiles} bestanden toegestaan`,
        variant: "destructive"
      });
      return;
    }

    // Process files
    const newUploadFiles: UploadFile[] = [];
    for (const file of validFiles) {
      try {
        const uploadFile = await processFile(file);
        newUploadFiles.push(uploadFile);
      } catch (error) {
        newUploadFiles.push({
          file,
          id: `error-${Date.now()}`,
          status: 'error',
          progress: 0,
          error: 'Failed to process file'
        });
      }
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [uploadFiles.length, maxFiles, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleUpload = useCallback(async () => {
    const readyFiles = uploadFiles.filter(f => f.status === 'uploading' && f.compressed);
    
    if (readyFiles.length === 0) {
      toast({
        title: "Geen bestanden klaar",
        description: "Er zijn geen bestanden klaar om te uploaden",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const filesToUpload = readyFiles.map(f => f.compressed!);
      await onUpload(filesToUpload);
      
      // Mark as completed
      setUploadFiles(prev => prev.map(f => 
        readyFiles.some(rf => rf.id === f.id)
          ? { ...f, status: 'completed' as const }
          : f
      ));
      
      toast({
        title: "Upload voltooid",
        description: `${readyFiles.length} bestand(en) succesvol geüpload`,
        variant: "default"
      });
    } catch (error) {
      // Mark as error
      setUploadFiles(prev => prev.map(f => 
        readyFiles.some(rf => rf.id === f.id)
          ? { ...f, status: 'error' as const, error: 'Upload failed' }
          : f
      ));
      
      toast({
        title: "Upload mislukt",
        description: "Er is een fout opgetreden tijdens het uploaden",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [uploadFiles, onUpload]);

  const clearCompleted = useCallback(() => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
  }, []);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        {canAddMore && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${dragActive 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              multiple
              accept={accept}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={!canAddMore}
              {...(isMobile && recommendedSettings)}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-lg font-medium">{description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isMobile ? 'Tap om foto\'s te selecteren of camera te openen' : 'Of sleep bestanden hierheen'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximaal {maxFiles} bestanden, elk maximaal 10MB
                </p>
              </div>

              {isMobile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = openCamera();
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files) handleFiles(target.files);
                    };
                  }}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </Button>
              )}
            </div>
          </div>
        )}

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bestanden ({uploadFiles.length})</h4>
              {completedFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Verwijder voltooid
                </Button>
              )}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg animate-fade-in"
                >
                  {/* Thumbnail */}
                  {uploadFile.thumbnail ? (
                    <img
                      src={uploadFile.thumbnail}
                      alt={uploadFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.compressed?.size || uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                      {uploadFile.compressed && uploadFile.compressed.size !== uploadFile.file.size && (
                        <span className="text-green-600 ml-1">
                          (gecomprimeerd van {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      )}
                    </p>
                    
                    {/* Progress */}
                    {uploadFile.status !== 'completed' && uploadFile.status !== 'error' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                  
                  {/* Status Icon */}
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    {uploadFile.status === 'compressing' && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {uploadFiles.some(f => f.status === 'uploading') && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploadFiles.every(f => f.status === 'completed' || f.status === 'error')}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploaden...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {uploadFiles.filter(f => f.status === 'uploading').length} bestand(en)
                </>
              )}
            </Button>
            
            {hasErrors && (
              <Button
                variant="outline"
                onClick={() => {
                  // Retry failed files
                  setUploadFiles(prev => prev.map(f => 
                    f.status === 'error' 
                      ? { ...f, status: 'uploading', error: undefined }
                      : f
                  ));
                }}
              >
                Opnieuw proberen
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};