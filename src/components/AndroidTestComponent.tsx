import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera as CameraIcon, Image } from 'lucide-react';

export function AndroidTestComponent() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');

  const testNativeCamera = async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('❌ Not running in native app');
      return;
    }

    try {
      setStatus('📸 Opening camera...');
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setStatus('✅ Camera capture successful!');
        
        // Hier kun je je bestaande AI scan logic aanroepen
        console.log('📱 Native camera image captured, ready for AI processing');
      }
    } catch (error) {
      setStatus(`❌ Camera error: ${error}`);
      console.error('Native camera error:', error);
    }
  };

  const testGallery = async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('❌ Not running in native app');
      return;
    }

    try {
      setStatus('🖼️ Opening gallery...');
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      
      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setStatus('✅ Gallery selection successful!');
      }
    } catch (error) {
      setStatus(`❌ Gallery error: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">🤖 Android Native Test</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Platform: {Capacitor.isNativePlatform() ? '📱 Native Android' : '🌐 Web Browser'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={testNativeCamera}
            className="flex items-center gap-2"
            disabled={!Capacitor.isNativePlatform()}
          >
            <CameraIcon className="h-4 w-4" />
            Camera
          </Button>
          
          <Button 
            onClick={testGallery}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!Capacitor.isNativePlatform()}
          >
            <Image className="h-4 w-4" />
            Gallery
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">{status}</p>
        </div>

        {capturedImage && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Captured Image:</p>
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-32 object-cover rounded border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}