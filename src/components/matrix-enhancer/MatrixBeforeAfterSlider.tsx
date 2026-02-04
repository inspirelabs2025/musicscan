import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MatrixBeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  className?: string;
}

export function MatrixBeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Origineel',
  afterLabel = 'Verbeterd',
  initialPosition = 50,
  className
}: MatrixBeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(newPosition);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full aspect-square rounded-lg overflow-hidden cursor-ew-resize select-none',
        'bg-muted',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Before image (full width) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* After image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-primary-foreground rounded-full" />
            <div className="w-0.5 h-4 bg-primary-foreground rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
        {afterLabel}
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-mono">
        {Math.round(position)}%
      </div>
    </div>
  );
}
