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
import { useCanvasProductCreator } from '@/hooks/useCanvasProductCreator';
import { usePhotoBatchProcessor } from '@/hooks/usePhotoBatchProcessor';
import { PhotoBatchProgress } from '@/components/admin/PhotoBatchProgress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, RefreshCw, Sparkles, ShoppingBag, Check, Zap } from 'lucide-react';

const STYLE_OPTIONS = [
  { value: 'vectorCartoon' as StyleType, label: 'Vectorized Cartoon', emoji: '🎭', description: 'Smooth vector portrait' },
  { value: 'posterize' as StyleType, label: 'Pop Art Posterize', emoji: '🎨', description: 'Andy Warhol style' },
  { value: 'oilPainting' as StyleType, label: 'Oil Painting', emoji: '🖌️', description: 'Classic portrait' },
  { value: 'watercolor' as StyleType, label: 'Watercolor', emoji: '💧', description: 'Soft and flowing' },
  { value: 'pencilSketch' as StyleType, label: 'Pencil Sketch', emoji: '✏️', description: 'Detailed drawing' },
  { value: 'comicBook' as StyleType, label: 'Comic Book', emoji: '💥', description: 'Bold outlines' },
  { value: 'abstract' as StyleType, label: 'Abstract Art', emoji: '🌈', description: 'Geometric shapes' },
  { value: 'warmGrayscale' as StyleType, label: 'Warm Grayscale', emoji: '🖤', description: 'Elegant B&W with warm tones' }
];

export default function PhotoStylizer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('vectorCartoon');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productType, setProductType] = useState<'poster' | 'canvas'>('poster');
  const [productMetadata, setProductMetadata] = useState({
    artist: '',
    title: '',
    description: '',
    price: 49.95
  });
  const [allStyleVariants, setAllStyleVariants] = useState<Array<{
    style: string;
    url: string;
    label: string;
    emoji: string;
  }>>([]);
  
  const { isProcessing, originalImage, stylizedImage, stylizePhoto, reset, downloadImage } = usePhotoStylizer();
  const { createPosterProduct, isCreating } = usePosterProductCreator();
  const { createCanvasProduct, isCreating: isCreatingCanvas } = useCanvasProductCreator();
  const { startBatch, isProcessing: isBatchProcessing, batchStatus, progress } = usePhotoBatchProcessor();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      reset();
      
      // Automatically start batch processing
      try {
        toast({
          title: "📤 Uploading photo...",
          description: "Starting automatic batch processing"
        });

        // Upload photo first
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `originals/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vinyl_images')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('vinyl_images')
          .getPublicUrl(filePath);

        // Start automatic batch processing
        await startBatch(publicUrl);
        
      } catch (error: any) {
        console.error('Auto-batch failed:', error);
        toast({
          title: "❌ Failed to start batch",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  }, [reset, startBatch, toast]);

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
    setAllStyleVariants([]);
    setProductMetadata({ artist: '', title: '', description: '', price: 49.95 });
  };

  const handleGenerateAllStyles = async () => {
    if (!selectedFile) return;
    
    setAllStyleVariants([]);
    
    try {
      toast({ title: "📤 Uploading photo..." });
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `originals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vinyl_images')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('vinyl_images')
        .getPublicUrl(filePath);
      
      toast({ 
        title: "🎨 Generating 7 artistic styles...", 
        description: "This takes ~1 minute" 
      });
      
      const { data, error } = await supabase.functions.invoke('batch-generate-poster-styles', {
        body: {
          posterUrl: publicUrl,
          eventId: `photo-${Date.now()}`,
          artistName: 'Custom Photo'
        }
      });
      
      if (error) throw error;
      
      setAllStyleVariants(data.styleVariants || []);
      if (data.styleVariants?.length > 0) {
        reset();
      }
      
      toast({ 
        title: `✅ ${data.styleVariants?.length || 0} styles generated!`,
        description: "Click on any style to preview"
      });
      
    } catch (error: any) {
      console.error('Batch generation failed:', error);
      toast({
        title: "❌ Generation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateProduct = async () => {
    if (!stylizedImage && allStyleVariants.length === 0) return;

    try {
      if (allStyleVariants.length > 0) {
        // Batch mode - always create as POSTER
        const result = await createPosterProduct({
          stylizedImage: allStyleVariants[0].url,
          artist: productMetadata.artist,
          title: productMetadata.title,
          description: productMetadata.description,
          style: 'multi-style' as StyleType,
          price: productMetadata.price,
          styleVariants: allStyleVariants.slice(1)
        });
        
        setShowProductDialog(false);
        navigate(`/product/${result.product_slug}`);
      } else {
        // Single style mode - can be POSTER or CANVAS
        if (productType === 'canvas') {
          const result = await createCanvasProduct({
            stylizedImage,
            artist: productMetadata.artist,
            title: productMetadata.title,
            description: productMetadata.description,
            style: selectedStyle,
            price: productMetadata.price
          });
          
          setShowProductDialog(false);
          navigate(`/product/${result.product_slug}`);
        } else {
          const result = await createPosterProduct({
            stylizedImage,
            artist: productMetadata.artist,
            title: productMetadata.title,
            description: productMetadata.description,
            style: selectedStyle,
            price: productMetadata.price
          });
          
          setShowProductDialog(false);
          navigate(`/product/${result.product_slug}`);
        }
      }
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
          Upload a photo to automatically generate all product variants (posters, canvas, T-shirts, socks)
        </p>
      </div>

      {/* Batch Progress Monitor */}
      {batchStatus && (
        <div className="mb-6">
          <PhotoBatchProgress batchStatus={batchStatus} progress={progress} />
        </div>
      )}

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
                    <Button 
                      onClick={() => {
                        setProductType('poster');
                        setProductMetadata(prev => ({ ...prev, price: 49.95 }));
                        setShowProductDialog(true);
                      }} 
                      variant="secondary" 
                      className="flex-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Save as POSTER
                    </Button>
                    <Button 
                      onClick={() => {
                        setProductType('canvas');
                        setProductMetadata(prev => ({ ...prev, price: 79.95 }));
                        setShowProductDialog(true);
                      }} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Save as CANVAS
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

      {/* Batch Generation Section */}
      {allStyleVariants.length === 0 && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate All Styles at Once
            </CardTitle>
            <CardDescription>
              Let AI create 7 artistic styles automatically (~1 minute)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateAllStyles}
              disabled={!selectedFile || isBatchProcessing}
              size="lg"
              className="w-full"
              variant="default"
            >
              {isBatchProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating 7 styles...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  ✨ Generate All 7 Styles Automatically
                </>
              )}
            </Button>
            
            {isBatchProcessing && (
              <div className="mt-4">
                <Progress value={undefined} className="w-full" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  AI is generating all 7 artistic styles...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Style Variants Preview Grid */}
      {allStyleVariants.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 Generated Style Variants ({allStyleVariants.length}/7)
            </CardTitle>
            <CardDescription>
              Click on any style to preview it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {allStyleVariants.map((variant) => (
                <button
                  key={variant.style}
                  onClick={() => {}}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg border-border hover:border-primary/50 bg-muted"
                >
                  <img 
                    src={variant.url} 
                    alt={variant.label}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end text-white text-center p-2 pb-3">
                    <span className="text-2xl mb-1">{variant.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{variant.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={() => setShowProductDialog(true)} 
                className="flex-1"
                size="lg"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Save All Styles as POSTER
              </Button>
              <Button 
                onClick={handleReset} 
                variant="outline"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Style Selection - Only show if not batch processing */}
      {allStyleVariants.length === 0 && (
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
      )}

      {/* Action Buttons - Only show for single style flow */}
      {allStyleVariants.length === 0 && (
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
      )}

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

      {/* Create Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {productType === 'canvas' ? '🖼️ Create CANVAS Product' : '🖼️ Create POSTER Product'}
            </DialogTitle>
            <DialogDescription>
              Add this stylized artwork to your ART SHOP as a {productType.toUpperCase()} product
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
                disabled={isCreating || isCreatingCanvas}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Pop Art Portrait"
                value={productMetadata.title}
                onChange={(e) => setProductMetadata({ ...productMetadata, title: e.target.value })}
                disabled={isCreating || isCreatingCanvas}
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
                disabled={isCreating || isCreatingCanvas}
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
                disabled={isCreating || isCreatingCanvas}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="flex items-center gap-2">
                <span className="font-medium">Style:</span>
                <span className="text-muted-foreground">{getStyleLabel()}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Category:</span>
                <span className="text-muted-foreground">{productType.toUpperCase()} (ART)</span>
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
              disabled={isCreating || isCreatingCanvas}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct}
              disabled={!productMetadata.artist || !productMetadata.title || isCreating || isCreatingCanvas}
            >
              {(isCreating || isCreatingCanvas) ? (
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
