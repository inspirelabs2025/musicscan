import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBulkPhotoBatchProcessor, PhotoMetadata } from '@/hooks/useBulkPhotoBatchProcessor';
import { Upload, X, Edit, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PhotoPreview {
  file: File;
  preview: string;
  metadata: PhotoMetadata;
}

export const BulkPhotoBatchUploader = () => {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editMetadata, setEditMetadata] = useState<PhotoMetadata>({
    name: '',
    artist: '',
    title: '',
    description: ''
  });

  const { startBulkBatch, isProcessing, uploadProgress } = useBulkPhotoBatchProcessor();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = 10 - photos.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newPhotos = filesToAdd.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      metadata: {
        name: `Photo ${photos.length + index + 1}`,
        artist: '',
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: ''
      }
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 10 - photos.length,
    disabled: isProcessing || photos.length >= 10
  });

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setEditMetadata({ ...photos[index].metadata });
  };

  const saveMetadata = () => {
    if (editingIndex !== null) {
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[editingIndex].metadata = { ...editMetadata };
        return newPhotos;
      });
      setEditingIndex(null);
    }
  };

  const canStartBatch = photos.length > 0 && 
    photos.every(p => p.metadata.name && p.metadata.artist && p.metadata.title) &&
    !isProcessing;

  const handleStartBatch = async () => {
    if (!canStartBatch) return;

    try {
      await startBulkBatch(
        photos.map(p => p.file),
        photos.map(p => p.metadata)
      );
    } catch (error) {
      console.error('Failed to start batch:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Photo Upload (Max 10 photos)
          </CardTitle>
          <CardDescription>
            Upload up to 10 photos to generate 100+ products automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length < 10 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors mb-6 ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop photos here' : 'Drop photos here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">
                {photos.length}/10 photos • Supports: JPG, PNG, WEBP
              </p>
            </div>
          )}

          {isProcessing && uploadProgress > 0 && (
            <div className="mb-6">
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Uploading photos... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <img
                      src={photo.preview}
                      alt={photo.metadata.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditDialog(index)}
                      disabled={isProcessing}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(index)}
                      disabled={isProcessing}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>

                  {/* Status indicator */}
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: photo.metadata.name && photo.metadata.artist && photo.metadata.title 
                        ? 'hsl(var(--success))' 
                        : 'hsl(var(--warning))'
                    }}
                  />

                  {/* Metadata preview */}
                  <div className="mt-2 text-xs space-y-1">
                    <p className="font-semibold truncate text-primary" title={photo.metadata.name}>
                      {photo.metadata.name || 'No name'}
                    </p>
                    <p className="font-medium truncate" title={photo.metadata.title}>
                      {photo.metadata.title || 'No title'}
                    </p>
                    <p className="text-muted-foreground truncate" title={photo.metadata.artist}>
                      {photo.metadata.artist || 'No artist'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Button */}
          {photos.length > 0 && (
            <div className="mt-6">
              <Button
                onClick={handleStartBatch}
                disabled={!canStartBatch}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    Processing {photos.length} photos...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    🚀 Start Batch Processing ({photos.length} photos → ~{photos.length * 10} products)
                  </>
                )}
              </Button>
              
              {!canStartBatch && photos.length > 0 && !isProcessing && (
                <p className="text-sm text-warning text-center mt-2">
                  ⚠️ All photos must have name, artist and title filled in
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo Metadata</DialogTitle>
            <DialogDescription>
              Provide name, artist and title for this photo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Photo Name *</Label>
              <Input
                id="name"
                value={editMetadata.name}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Photo 1, Vinyl Collection, etc."
              />
            </div>

            <div>
              <Label htmlFor="artist">Artist Name *</Label>
              <Input
                id="artist"
                value={editMetadata.artist}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="e.g., Pink Floyd"
              />
            </div>

            <div>
              <Label htmlFor="title">Album/Photo Title *</Label>
              <Input
                id="title"
                value={editMetadata.title}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Dark Side of the Moon"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={editMetadata.description}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about the photo..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIndex(null)}>
              Cancel
            </Button>
            <Button 
              onClick={saveMetadata}
              disabled={!editMetadata.name || !editMetadata.artist || !editMetadata.title}
            >
              Save Metadata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
