import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { usePhotoStylizer, StyleType } from '@/hooks/usePhotoStylizer';
import { Upload, Download, RefreshCw, Sparkles } from 'lucide-react';

const STYLE_OPTIONS = [
  { value: 'posterize' as StyleType, label: 'Pop Art Posterize', emoji: '🎨', description: 'Andy Warhol style' },
  { value: 'oilPainting' as StyleType, label: 'Oil Painting', emoji: '🖌️', description: 'Classic portrait' },
  { value: 'watercolor' as StyleType, label: 'Watercolor', emoji: '💧', description: 'Soft and flowing' },
  { value: 'pencilSketch' as StyleType, label: 'Pencil Sketch', emoji: '✏️', description: 'Detailed drawing' },
  { value: 'comicBook' as StyleType, label: 'Comic Book', emoji: '💥', description: 'Bold outlines' },
  { value: 'abstract' as StyleType, label: 'Abstract Art', emoji: '🌈', description: 'Geometric shapes' }
];

export default function PhotoStylizer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('posterize');
  const { isProcessing, originalImage, stylizedImage, stylizePhoto, reset, downloadImage } = usePhotoStylizer();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      reset();
    }
  }, [reset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleStylize = async () => {
    if (!selectedFile) return;
    await stylizePhoto(selectedFile, selectedStyle);
  };

  const handleDownload = () => {
    if (stylizedImage) {
      downloadImage(stylizedImage, `stylized-${selectedStyle}-${Date.now()}.png`);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/main">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Photo Art Stylizer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🎨 Photo Art Stylizer
        </h1>
        <p className="text-muted-foreground">
          Transform your photos into stunning artistic styles using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Photo
            </CardTitle>
            <CardDescription>Drag & drop or click to upload your photo</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="space-y-4">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop your photo here' : 'Drop photo here or click to browse'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports: JPG, PNG, WEBP (max 20MB)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Stylized Result
            </CardTitle>
            <CardDescription>Your transformed artistic photo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center min-h-[300px] flex items-center justify-center">
              {stylizedImage ? (
                <div className="space-y-4 w-full">
                  <img
                    src={stylizedImage}
                    alt="Stylized result"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Result
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground space-y-2">
                  <Sparkles className="w-12 h-12 mx-auto opacity-30" />
                  <p>Your stylized photo will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Style Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Choose Your Style</CardTitle>
          <CardDescription>Select an artistic style to apply to your photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                disabled={isProcessing}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedStyle === style.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="text-3xl mb-2">{style.emoji}</div>
                <div className="font-semibold text-sm mb-1">{style.label}</div>
                <div className="text-xs text-muted-foreground">{style.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={handleStylize}
          disabled={!selectedFile || isProcessing}
          size="lg"
          className="min-w-[200px]"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Transforming...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Stylize Photo
            </>
          )}
        </Button>

        {(selectedFile || stylizedImage) && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={isProcessing}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      {isProcessing && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing your photo...</span>
                <span className="text-muted-foreground">This may take 3-5 seconds</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
