import React, { useState, useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedScanPreviewProps {
  originalImage: string;
  enhancedImage?: string;
  processingStats?: {
    enhancementFactor?: number;
    multiShotVariants?: number;
    pixelsEnhanced?: number;
  };
  className?: string;
}

/**
 * Live comparison slider between original and enhanced scan
 * Allows users to see the preprocessing improvements
 */
export const EnhancedScanPreview = React.memo(({
  originalImage,
  enhancedImage,
  processingStats,
  className
}: EnhancedScanPreviewProps) => {
  const [sliderValue, setSliderValue] = useState([50]);
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value);
  }, []);

  const toggleZoom = useCallback(() => {
    setIsZoomed(prev => !prev);
  }, []);

  // If no enhanced image, just show original
  if (!enhancedImage) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-muted", className)}>
        <img 
          src={originalImage} 
          alt="Origineel" 
          className="w-full h-auto object-contain"
        />
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
          <Eye className="h-3 w-3 mr-1" />
          Origineel
        </Badge>
      </div>
    );
  }

  const splitPosition = sliderValue[0];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Comparison container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative rounded-lg overflow-hidden bg-black cursor-pointer transition-all",
          isZoomed && "fixed inset-4 z-50 rounded-xl"
        )}
        onClick={toggleZoom}
      >
        {/* Original image (full) */}
        <img 
          src={originalImage} 
          alt="Origineel" 
          className="w-full h-auto object-contain"
        />
        
        {/* Enhanced image (clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
        >
          <img 
            src={enhancedImage} 
            alt="Verbeterd" 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Slider line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
          style={{ left: `${splitPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-xs bg-black/70 text-white border-0"
        >
          <Eye className="h-3 w-3 mr-1" />
          Origineel
        </Badge>
        <Badge 
          className="absolute top-2 right-2 text-xs bg-primary/90 text-primary-foreground border-0"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Smart Verbeterd
        </Badge>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2">
          {isZoomed ? (
            <ZoomOut className="h-5 w-5 text-white/70" />
          ) : (
            <ZoomIn className="h-5 w-5 text-white/70" />
          )}
        </div>
      </div>

      {/* Slider control */}
      <div className="px-2">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          max={100}
          min={0}
          step={1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>← Origineel</span>
          <span>Verbeterd →</span>
        </div>
      </div>

      {/* Processing stats */}
      {processingStats && (
        <div className="flex flex-wrap gap-2 text-xs">
          {processingStats.enhancementFactor && processingStats.enhancementFactor > 1 && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              {processingStats.enhancementFactor.toFixed(1)}x versterkt
            </Badge>
          )}
          {processingStats.multiShotVariants && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              {processingStats.multiShotVariants} virtuele opnames
            </Badge>
          )}
          {processingStats.pixelsEnhanced && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              {(processingStats.pixelsEnhanced / 1000).toFixed(0)}K pixels verbeterd
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedScanPreview.displayName = 'EnhancedScanPreview';
