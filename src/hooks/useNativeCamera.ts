import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useNativeCamera = () => {
  const isNative = Capacitor.isNativePlatform();
  
  const takePicture = async () => {
    if (!isNative) {
      // Fallback naar web camera API
      return useWebCamera();
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      return image.dataUrl;
    } catch (error) {
      console.error('Native camera error:', error);
      throw error;
    }
  };

  const pickFromGallery = async () => {
    if (!isNative) return null;
    
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });
    
    return image.dataUrl;
  };

  return { takePicture, pickFromGallery, isNative };
};