import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Trash2, RefreshCw, Film, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface TemplateFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

export function TemplateManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch templates from bucket
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['video-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('video-templates')
        .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });
      
      if (error) throw error;
      return (data || []).filter(f => f.name.toLowerCase().endsWith('.gif')) as TemplateFile[];
    },
  });

  // Upload template
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { error } = await supabase.storage
        .from('video-templates')
        .upload(file.name, file, { upsert: true });
      
      if (error) throw error;
      return file.name;
    },
    onSuccess: (filename) => {
      toast.success(`Template "${filename}" geüpload`);
      queryClient.invalidateQueries({ queryKey: ['video-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Upload mislukt: ${error.message}`);
    },
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const { error } = await supabase.storage
        .from('video-templates')
        .remove([filename]);
      
      if (error) throw error;
      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`Template "${filename}" verwijderd`);
      queryClient.invalidateQueries({ queryKey: ['video-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Verwijderen mislukt: ${error.message}`);
    },
  });

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      if (!file.name.toLowerCase().endsWith('.gif')) {
        toast.error(`${file.name} is geen GIF bestand`);
        continue;
      }
      
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        console.error('Upload error:', error);
        // Error already shown via mutation onError
      }
    }
    
    setUploading(false);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/gif': ['.gif'] },
    multiple: true,
  });

  // Get public URL for template
  const getTemplateUrl = (filename: string) => {
    const { data } = supabase.storage
      .from('video-templates')
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              🎨 Video Templates
            </CardTitle>
            <CardDescription>
              Beheer GIF templates (160×284px) voor video achtergronden
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Uploaden...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive 
                  ? 'Drop GIF bestanden hier...' 
                  : 'Klik of sleep GIF templates hier (160×284px)'}
              </p>
            </>
          )}
        </div>

        {/* Template count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </Badge>
          {templates.length === 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Upload minimaal 1 template om video's te genereren
            </span>
          )}
        </div>

        {/* Template grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {templates.map((template) => (
              <div 
                key={template.name} 
                className="relative group rounded-lg overflow-hidden border bg-card"
              >
                {/* Template preview */}
                <div className="aspect-[9/16] bg-muted">
                  <img
                    src={getTemplateUrl(template.name)}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Info overlay */}
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium truncate" title={template.name}>
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(template.metadata?.size as number || 0)}
                  </p>
                </div>
                
                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={() => deleteMutation.mutate(template.name)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
