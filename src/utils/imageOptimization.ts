import { useState, useEffect } from 'react';

// Image optimization utilities
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'webp',
  maxSizeMB: 2
};

export const compressImage = async (
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;
      
      if (width > opts.maxWidth) {
        width = opts.maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > opts.maxHeight) {
        height = opts.maxHeight;
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Check size and reduce quality if needed
          const sizeMB = blob.size / (1024 * 1024);
          if (sizeMB > opts.maxSizeMB && opts.quality > 0.1) {
            // Recursively reduce quality
            compressImage(file, { ...opts, quality: opts.quality * 0.8 })
              .then(resolve)
              .catch(reject);
            return;
          }
          
          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        `image/${opts.format}`,
        opts.quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const generateThumbnail = async (
  file: File,
  size: number = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      // Calculate crop dimensions for square thumbnail
      const { width, height } = img;
      const minDimension = Math.min(width, height);
      const x = (width - minDimension) / 2;
      const y = (height - minDimension) / 2;
      
      ctx?.drawImage(
        img, 
        x, y, minDimension, minDimension,
        0, 0, size, size
      );
      
      resolve(canvas.toDataURL('image/webp', 0.7));
    };
    
    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};

// Batch process multiple images
export const compressImages = async (
  files: File[],
  options?: ImageCompressionOptions
): Promise<File[]> => {
  const promises = files.map(file => compressImage(file, options));
  return Promise.all(promises);
};

// Check if browser supports WebP
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Progressive image loading hook
export const useProgressiveImage = (src: string, placeholder?: string) => {
  const [imgSrc, setImgSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { imgSrc, isLoaded };
};