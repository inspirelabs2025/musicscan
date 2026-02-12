import { useNativeCamera } from '@/hooks/useNativeCamera';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export function NativeScanner() {
  const { takePicture, pickFromGallery, isNative } = useNativeCamera();
  
  const handleCameraScan = async () => {
    try {
      const imageData = await takePicture();
      // Process image with your existing AI scan logic
      console.log('📸 Native camera image captured');
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const imageData = await pickFromGallery();
      // Process image with your existing AI scan logic
      console.log('🖼️ Gallery image selected');
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  return (
    <div className="grid gap-4">
      {isNative && (
        <div className="bg-primary/10 p-4 rounded-lg border">
          <p className="text-sm text-primary mb-3">
            🚀 Running in native app mode
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleCameraScan} className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Native Camera
            </Button>
            
            <Button onClick={handleGalleryPick} variant="outline" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Gallery
            </Button>
          </div>
        </div>
      )}
      
      {!isNative && (
        <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            🌐 Running in web mode - native features disabled
          </p>
        </div>
      )}
    </div>
  );
}