import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UploadedFile {
  file: File;
  preview: string;
  url?: string;
  id?: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadFile = async (file: File, step: number): Promise<string | null> => {
    setUploading(true);
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-step-${step}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vinyl_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Error",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vinyl_images')
        .getPublicUrl(data.path);

      toast({
        title: "Upload Successful",
        description: `Foto voor stap ${step} is geüpload`,
        variant: "default"
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error", 
        description: "Er is een fout opgetreden bij het uploaden",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    const newFile: UploadedFile = {
      file,
      preview,
      id: Date.now().toString()
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    return newFile;
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearFiles = () => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
  };

  return {
    uploading,
    uploadedFiles,
    uploadFile,
    addFile,
    removeFile,
    clearFiles
  };
};