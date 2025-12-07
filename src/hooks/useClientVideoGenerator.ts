import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VideoStyle = 'contain' | 'cover' | 'blurred-background';

interface VideoGeneratorOptions {
  images: string[];
  fps?: number;
  style?: VideoStyle;
  durationPerImage?: number; // seconds per image
  resolution?: { width: number; height: number };
}

interface VideoGeneratorResult {
  videoUrl: string;
  blob: Blob;
}

export const useClientVideoGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const drawImageWithStyle = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    style: VideoStyle
  ) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    if (style === 'cover') {
      // Crop to fill
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      if (imgAspect > canvasAspect) {
        sWidth = img.height * canvasAspect;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / canvasAspect;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else if (style === 'blurred-background') {
      // Draw blurred background
      let bgSx = 0, bgSy = 0, bgSWidth = img.width, bgSHeight = img.height;
      if (imgAspect > canvasAspect) {
        bgSWidth = img.height * canvasAspect;
        bgSx = (img.width - bgSWidth) / 2;
      } else {
        bgSHeight = img.width / canvasAspect;
        bgSy = (img.height - bgSHeight) / 2;
      }
      ctx.filter = 'blur(20px)';
      ctx.drawImage(img, bgSx, bgSy, bgSWidth, bgSHeight, -20, -20, width + 40, height + 40);
      ctx.filter = 'none';

      // Draw foreground (contain)
      let fgWidth, fgHeight;
      if (imgAspect > canvasAspect) {
        fgWidth = width;
        fgHeight = width / imgAspect;
      } else {
        fgHeight = height;
        fgWidth = height * imgAspect;
      }
      const fgX = (width - fgWidth) / 2;
      const fgY = (height - fgHeight) / 2;
      ctx.drawImage(img, fgX, fgY, fgWidth, fgHeight);
    } else {
      // contain (default)
      let drawWidth, drawHeight;
      if (imgAspect > canvasAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
      } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
      }
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }
  };

  const generateVideo = useCallback(async (options: VideoGeneratorOptions): Promise<VideoGeneratorResult> => {
    const {
      images,
      fps = 30,
      style = 'blurred-background',
      durationPerImage = 3,
      resolution = { width: 1080, height: 1920 }
    } = options;

    if (!images.length) {
      throw new Error('No images provided');
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = resolution.width;
      canvas.height = resolution.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load all images first
      toast({ title: '📷 Afbeeldingen laden...', description: `${images.length} afbeeldingen` });
      const loadedImages: HTMLImageElement[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = await loadImage(images[i]);
        loadedImages.push(img);
        setProgress((i + 1) / images.length * 20); // 0-20% for loading
      }

      // Setup MediaRecorder
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps for good quality
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      toast({ title: '🎬 Video genereren...', description: 'Dit kan even duren' });

      // Render frames
      const framesPerImage = fps * durationPerImage;
      const totalFrames = framesPerImage * loadedImages.length;
      let currentFrame = 0;

      for (let imgIndex = 0; imgIndex < loadedImages.length; imgIndex++) {
        const img = loadedImages[imgIndex];
        
        for (let frame = 0; frame < framesPerImage; frame++) {
          drawImageWithStyle(ctx, img, resolution.width, resolution.height, style);
          
          // Wait for next frame timing
          await new Promise(resolve => setTimeout(resolve, 1000 / fps));
          
          currentFrame++;
          setProgress(20 + (currentFrame / totalFrames) * 70); // 20-90% for rendering
        }
      }

      // Stop recording and wait for data
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = async () => {
          try {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            
            // Create object URL
            const videoUrl = URL.createObjectURL(webmBlob);
            
            setProgress(100);
            toast({ title: '✅ Video klaar!', description: 'Uploaden naar storage...' });

            resolve({ videoUrl, blob: webmBlob });
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.onerror = (e) => reject(e);
        mediaRecorder.stop();
      });

    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const uploadVideo = useCallback(async (blob: Blob, filename: string): Promise<string> => {
    const filePath = `videos/${Date.now()}_${filename}.webm`;
    
    const { error: uploadError } = await supabase.storage
      .from('tiktok_videos')
      .upload(filePath, blob, { contentType: 'video/webm' });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tiktok_videos')
      .getPublicUrl(filePath);

    return publicUrl;
  }, []);

  return {
    generateVideo,
    uploadVideo,
    isGenerating,
    progress
  };
};
