import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { usePhotoStylizer, StyleType } from '@/hooks/usePhotoStylizer';
import { usePosterProductCreator } from '@/hooks/usePosterProductCreator';
import { Upload, Download, RefreshCw, Sparkles, ShoppingBag } from 'lucide-react';

const STYLE_OPTIONS = [
  { value: 'vectorCartoon' as StyleType, label: 'Vectorized Cartoon', emoji: '🎭', description: 'Smooth vector portrait' },
  { value: 'posterize' as StyleType, label: 'Pop Art Posterize', emoji: '🎨', description: 'Andy Warhol style' },
  { value: 'oilPainting' as StyleType, label: 'Oil Painting', emoji: '🖌️', description: 'Classic portrait' },
  { value: 'watercolor' as StyleType, label: 'Watercolor', emoji: '💧', description: 'Soft and flowing' },
  { value: 'pencilSketch' as StyleType, label: 'Pencil Sketch', emoji: '✏️', description: 'Detailed drawing' },
  { value: 'comicBook' as StyleType, label: 'Comic Book', emoji: '💥', description: 'Bold outlines' },
  { value: 'abstract' as StyleType, label: 'Abstract Art', emoji: '🌈', description: 'Geometric shapes' }
];

export default function PhotoStylizer() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('vectorCartoon');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productMetadata, setProductMetadata] = useState({
    artist: '',
    title: '',
    description: '',
    price: 49.95
  });
  
  const { isProcessing, originalImage, stylizedImage, stylizePhoto, reset, downloadImage } = usePhotoStylizer();
  const { createPosterProduct, isCreating } = usePosterProductCreator();

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
    setProductMetadata({ artist: '', title: '', description: '', price: 49.95 });
  };

  const handleCreateProduct = async () => {
    if (!stylizedImage) return;

    try {
      const result = await createPosterProduct({
        stylizedImage,
        artist: productMetadata.artist,
        title: productMetadata.title,
        description: productMetadata.description,
        style: selectedStyle,
        price: productMetadata.price
      });

      setShowProductDialog(false);
      
      // Navigate to the new product
      navigate(`/product/${result.product_slug}`);
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const getStyleLabel = () => {
    const style = STYLE_OPTIONS.find(s => s.value === selectedStyle);
    return style ? style.label : selectedStyle;
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
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={() => setShowProductDialog(true)} variant="secondary" className="flex-1">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Save as POSTER
                    </Button>
                  </div>
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

      {/* Create POSTER Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🖼️ Create POSTER Product
            </DialogTitle>
            <DialogDescription>
              Add this stylized artwork to your ART SHOP as a POSTER product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="artist">Artist Name *</Label>
              <Input
                id="artist"
                placeholder="e.g., Freddie Mercury"
                value={productMetadata.artist}
                onChange={(e) => setProductMetadata({ ...productMetadata, artist: e.target.value })}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Pop Art Portrait"
                value={productMetadata.title}
                onChange={(e) => setProductMetadata({ ...productMetadata, title: e.target.value })}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Custom description (AI will generate one if left empty)"
                value={productMetadata.description}
                onChange={(e) => setProductMetadata({ ...productMetadata, description: e.target.value })}
                rows={3}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={productMetadata.price}
                onChange={(e) => setProductMetadata({ ...productMetadata, price: parseFloat(e.target.value) || 0 })}
                disabled={isCreating}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="flex items-center gap-2">
                <span className="font-medium">Style:</span>
                <span className="text-muted-foreground">{getStyleLabel()}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Category:</span>
                <span className="text-muted-foreground">POSTER (ART)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Media Type:</span>
                <span className="text-muted-foreground">ART</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowProductDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct}
              disabled={!productMetadata.artist || !productMetadata.title || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
