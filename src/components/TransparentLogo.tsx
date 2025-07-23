import React, { useEffect, useState } from 'react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';

interface TransparentLogoProps {
  originalUrl: string;
  alt: string;
  className?: string;
}

export const TransparentLogo: React.FC<TransparentLogoProps> = ({
  originalUrl,
  alt,
  className
}) => {
  const [transparentImageUrl, setTransparentImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessing(true);
        setError(null);
        
        // Load the original image
        const imageElement = await loadImageFromUrl(originalUrl);
        
        // Remove background
        const transparentBlob = await removeBackground(imageElement);
        
        // Create URL for the transparent image
        const url = URL.createObjectURL(transparentBlob);
        setTransparentImageUrl(url);
        
      } catch (err) {
        console.error('Error processing logo:', err);
        setError('Failed to process logo');
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();

    // Cleanup function to revoke URL
    return () => {
      if (transparentImageUrl) {
        URL.revokeObjectURL(transparentImageUrl);
      }
    };
  }, [originalUrl]);

  if (isProcessing) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded`}>
        <div className="text-xs text-muted-foreground">Processing...</div>
      </div>
    );
  }

  if (error || !transparentImageUrl) {
    // Fallback to original image if processing fails
    return <img src={originalUrl} alt={alt} className={className} />;
  }

  return <img src={transparentImageUrl} alt={alt} className={className} />;
};