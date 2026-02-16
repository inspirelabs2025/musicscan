import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMobileFileUpload } from '@/hooks/useMobileOptimized';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileUploadProps {
  step: number;
  stepTitle: string;
  stepDescription: string;
  onFileUploaded?: (url: string) => void;
  onFileSelected?: (file: File) => void;
  skipUpload?: boolean;
  accept?: string;
  isCompleted?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  step, stepTitle, stepDescription, onFileUploaded, onFileSelected,
  skipUpload = false, accept = "image/*", isCompleted = false
}) => {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  
  const { uploading, uploadFile, addFile } = useFileUpload();
  const { isMobile, platform, recommendedSettings } = useMobileFileUpload();

  useEffect(() => {
    if (!isCompleted) {
      setUploadedUrl(null);
      setLocalFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [step, isCompleted]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
      toast({ title: sc.heicNotSupported, description: sc.heicConvert, variant: "destructive" });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: sc.invalidFile, description: sc.selectImage, variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: sc.fileTooLarge, description: sc.maxFileSize, variant: "destructive" });
      return;
    }

    if (skipUpload) { setLocalFile(file); onFileSelected?.(file); return; }

    addFile(file);
    try {
      const url = await uploadFile(file, step);
      if (url) { setUploadedUrl(url); onFileUploaded?.(url); }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: sc.uploadFailed, description: sc.uploadFailedDesc, variant: "destructive" });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); };

  const openFileDialog = () => {
    if (isMobile && navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => {});
    }
    fileInputRef.current?.click();
  };

  const removeUpload = () => {
    setUploadedUrl(null); setLocalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFileReady = uploadedUrl || localFile || isCompleted;
  const isLoading = uploading && !skipUpload;

  return (
    <Card variant="dark" className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>{sc.step} {step}: {stepTitle}</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{stepDescription}</p>
        </div>

        {isFileReady ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="text-center space-y-3">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-green-800 dark:text-green-200">
                    {skipUpload ? sc.photoSelected : sc.photoUploaded}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {sc.stepCompleted.replace('{step}', String(step))}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={removeUpload} className="flex-1">
                <X className="w-4 h-4 mr-2" />{sc.chooseOtherPhoto}
              </Button>
              {uploadedUrl && (
                <Button onClick={() => window.open(uploadedUrl, '_blank')} className="flex-1">{sc.viewPhoto}</Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-lg font-medium">{sc.uploading}</p>
                  <p className="text-sm text-muted-foreground">{sc.pleaseWait}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">{sc.dragOrClick}</p>
                  <p className="text-sm text-muted-foreground mb-4">{sc.supportedFormats}</p>
                </div>
                <Button size="lg" onClick={openFileDialog} disabled={isLoading}>
                  {isMobile ? <Camera className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {isMobile ? sc.takePhoto : sc.choosePhoto}
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef} type="file"
          accept={isMobile ? recommendedSettings.accept : accept}
          capture={isMobile ? recommendedSettings.capture : undefined}
          onChange={handleInputChange} className="hidden" style={{ fontSize: '16px' }}
        />
      </CardContent>
    </Card>
  );
};
