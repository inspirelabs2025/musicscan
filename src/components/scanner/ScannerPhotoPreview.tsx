import React, { useState } from 'react';
import { X, Eye, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ProcessingStats {
  contrastApplied: boolean;
  wasResized: boolean;
  processingTimeMs: number;
}

interface ScannerPhotoPreviewProps {
  id: string;
  fileName: string;
  originalPreview: string;
  processedPreview?: string;
  processingStats?: ProcessingStats;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/**
 * Individual photo preview with original/processed comparison slider
 */
export const ScannerPhotoPreview = React.memo(({
  id,
  fileName,
  originalPreview,
  processedPreview,
  processingStats,
  onRemove,
  disabled = false
}: ScannerPhotoPreviewProps) => {
  const [sliderValue, setSliderValue] = useState([50]);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasProcessed = !!processedPreview && processedPreview !== originalPreview;
  const splitPosition = sliderValue[0];

  return (
    <div className="relative group bg-card rounded-lg border overflow-hidden">
      {/* Image comparison container */}
      <div 
        className="relative aspect-square cursor-pointer"
        onClick={() => hasProcessed && setIsExpanded(!isExpanded)}
      >
        {/* Original image (full) */}
        <img 
          src={originalPreview} 
          alt={fileName}
          className="w-full h-full object-cover"
        />
        
        {/* Processed image overlay (clipped) */}
        {hasProcessed && (
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
          >
            <img 
              src={processedPreview} 
              alt={`${fileName} - verbeterd`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Slider line indicator */}
        {hasProcessed && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm pointer-events-none z-10"
            style={{ left: `${splitPosition}%` }}
          />
        )}

        {/* Labels */}
        {hasProcessed && (
          <>
            <Badge 
              variant="secondary" 
              className="absolute top-1 left-1 text-[10px] bg-black/60 text-white border-0 px-1.5 py-0.5"
            >
              <Eye className="h-2.5 w-2.5 mr-0.5" />
              Orig
            </Badge>
            <Badge 
              className="absolute top-1 right-1 text-[10px] bg-primary/80 text-primary-foreground border-0 px-1.5 py-0.5"
            >
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              Smart
            </Badge>
          </>
        )}

        {/* Remove button */}
        {!disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Slider control (when has processed image) */}
      {hasProcessed && (
        <div className="px-2 py-1.5 bg-muted/50">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            min={0}
            step={1}
            className="cursor-pointer"
          />
        </div>
      )}

      {/* File name and stats */}
      <div className="px-2 py-1.5 bg-muted/30">
        <p className="text-xs text-muted-foreground truncate">
          {fileName}
        </p>
        
        {/* Processing stats badge */}
        {processingStats && (
          <div className="flex items-center gap-1 mt-1">
            {processingStats.contrastApplied && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                Contrast+
              </Badge>
            )}
            {processingStats.wasResized && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
                Geoptimaliseerd
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && processingStats && (
        <div className="px-2 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Verwerkingstijd:</span>
            <span>{processingStats.processingTimeMs.toFixed(0)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
});

ScannerPhotoPreview.displayName = 'ScannerPhotoPreview';
