import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type VideoStyle = 'contain' | 'cover' | 'blurred-background';
export type ZoomEffect = 'none' | 'grow-in' | 'grow-out' | 'grow-in-out';

interface VideoGeneratorOptions {
  images: string[];
  fps?: number;
  style?: VideoStyle;
  zoomEffect?: ZoomEffect;
  durationPerImage?: number; // seconds per image
  resolution?: { width: number; height: number };
}

interface VideoGeneratorResult {
  videoUrl: string;
  blob: Blob;
}

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;
let ffmpegLoadFailed = false;

const getFFmpeg = async (): Promise<FFmpeg | null> => {
  // If we already know loading failed, don't retry
  if (ffmpegLoadFailed) {
    return null;
  }
  
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }
  
  try {
    ffmpegInstance = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    // Add timeout for FFmpeg loading (30 seconds max)
    const loadPromise = ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('FFmpeg load timeout')), 30000)
    );
    
    await Promise.race([loadPromise, timeoutPromise]);
    
    ffmpegLoaded = true;
    console.log('FFmpeg loaded successfully');
    return ffmpegInstance;
  } catch (error) {
    console.error('FFmpeg loading failed:', error);
    ffmpegLoadFailed = true;
    ffmpegInstance = null;
    return null;
  }
};

export const useClientVideoGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Load image via proxy to bypass CORS for external images
  const loadImage = async (url: string): Promise<HTMLImageElement> => {
    // Use image proxy for external URLs (Discogs, etc.)
    let imageUrl = url;
    if (url.includes('discogs.com') || url.includes('i.scdn.co')) {
      const proxyUrl = `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
      imageUrl = proxyUrl;
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = imageUrl;
    });
  };

  const drawImageWithStyle = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    style: VideoStyle,
    scale: number = 1
  ) => {
    // Clear with black background BEFORE any transforms
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    if (style === 'blurred-background') {
      // Draw blurred background (no scale for bg)
      ctx.save();
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
      ctx.restore();

      // Draw foreground with scale
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
      
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
      ctx.restore();
    } else if (style === 'cover') {
      // Apply scale transform from center
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      if (imgAspect > canvasAspect) {
        sWidth = img.height * canvasAspect;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / canvasAspect;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
      ctx.restore();
    } else {
      // contain (default) with scale
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

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
      ctx.restore();
    }
  };

  // Calculate zoom scale based on effect and progress (0-1)
  const calculateZoomScale = (effect: ZoomEffect, progress: number): number => {
    const minScale = 1.0;
    const maxScale = 2.5; // 150% zoom - very dramatic
    const speed = 3; // Speed multiplier for faster zoom cycles
    
    switch (effect) {
      case 'grow-in':
        // Start small, end big
        return minScale + (maxScale - minScale) * progress;
      case 'grow-out':
        // Start big, end small
        return maxScale - (maxScale - minScale) * progress;
      case 'grow-in-out':
        // Faster zoom cycles with speed multiplier (multiple zoom in/out cycles)
        const fastProgress = (progress * speed) % 1;
        const sineProgress = Math.sin(fastProgress * Math.PI);
        return minScale + (maxScale - minScale) * sineProgress;
      case 'none':
      default:
        return 1;
    }
  };

  // Convert WebM to MP4 using FFmpeg.wasm (with fallback to WebM)
  const convertToMp4 = async (webmBlob: Blob): Promise<Blob> => {
    toast({ title: '🔄 Converteren naar MP4...', description: 'FFmpeg laden...' });
    
    const ffmpeg = await getFFmpeg();
    
    // If FFmpeg failed to load, return WebM as fallback
    if (!ffmpeg) {
      console.warn('FFmpeg not available, using WebM format');
      toast({ title: '⚠️ MP4 conversie niet beschikbaar', description: 'WebM format wordt gebruikt' });
      return webmBlob;
    }
    
    try {
      // Write input file
      const webmData = await fetchFile(webmBlob);
      await ffmpeg.writeFile('input.webm', webmData);
      
      toast({ title: '🔄 Converteren naar MP4...', description: 'Video transcoden...' });
      
      // Convert to MP4 with H.264 codec for maximum compatibility
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);
      
      // Read output file
      const mp4Data = await ffmpeg.readFile('output.mp4');
      
      // Cleanup
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp4');
      
      // Convert to Blob - copy buffer to new ArrayBuffer for type compatibility
      const uint8Array = mp4Data as Uint8Array;
      const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
      new Uint8Array(arrayBuffer).set(uint8Array);
      
      console.log('MP4 conversion successful');
      return new Blob([arrayBuffer], { type: 'video/mp4' });
    } catch (error) {
      console.error('MP4 conversion failed, using WebM fallback:', error);
      toast({ title: '⚠️ MP4 conversie mislukt', description: 'WebM format wordt gebruikt' });
      return webmBlob;
    }
  };

  const generateVideo = useCallback(async (options: VideoGeneratorOptions): Promise<VideoGeneratorResult> => {
    const {
      images,
      fps = 30,
      style = 'blurred-background',
      zoomEffect = 'grow-in-out',
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
        setProgress((i + 1) / images.length * 15); // 0-15% for loading
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

      toast({ title: '🎬 Video genereren...', description: 'Frames renderen...' });

      // Render frames
      const framesPerImage = fps * durationPerImage;
      const totalFrames = framesPerImage * loadedImages.length;
      let currentFrame = 0;

      for (let imgIndex = 0; imgIndex < loadedImages.length; imgIndex++) {
        const img = loadedImages[imgIndex];
        
        for (let frame = 0; frame < framesPerImage; frame++) {
          // Calculate zoom progress for this frame (0 to 1)
          const frameProgress = frame / (framesPerImage - 1 || 1);
          const scale = calculateZoomScale(zoomEffect, frameProgress);
          
          // Log first and last frame scale for debugging
          if (frame === 0 || frame === framesPerImage - 1) {
            console.log(`Frame ${frame}/${framesPerImage}: progress=${frameProgress.toFixed(2)}, scale=${scale.toFixed(3)}, effect=${zoomEffect}`);
          }
          
          drawImageWithStyle(ctx, img, resolution.width, resolution.height, style, scale);
          
          // Use requestAnimationFrame timing for smoother capture
          await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 1000 / fps)));
          
          currentFrame++;
          setProgress(15 + (currentFrame / totalFrames) * 55); // 15-70% for rendering
        }
      }

      // Stop recording and wait for WebM data
      const webmBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        mediaRecorder.onerror = (e) => reject(e);
        mediaRecorder.stop();
      });

      setProgress(70);
      
      // Convert WebM to MP4
      const mp4Blob = await convertToMp4(webmBlob);
      
      setProgress(95);
      
      // Create object URL
      const videoUrl = URL.createObjectURL(mp4Blob);
      
      setProgress(100);
      toast({ title: '✅ MP4 Video klaar!', description: 'Uploaden naar storage...' });

      return { videoUrl, blob: mp4Blob };

    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const uploadVideo = useCallback(async (blob: Blob, filename: string): Promise<string> => {
    // Determine file extension based on blob type
    const isMP4 = blob.type === 'video/mp4';
    const extension = isMP4 ? 'mp4' : 'webm';
    const contentType = isMP4 ? 'video/mp4' : 'video/webm';
    
    const filePath = `videos/${Date.now()}_${filename}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tiktok-videos')
      .upload(filePath, blob, { contentType });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tiktok-videos')
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
