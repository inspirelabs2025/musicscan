import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, Binary, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtremeEnhancementPreviewProps {
  variants: {
    original: string;
    minChannel: string;
    binarized: string;
  };
  hubDetected: boolean;
  cropApplied: boolean;
  qualityScore?: 'excellent' | 'good' | 'fair' | 'poor';
  reflectionLevel?: number;
  className?: string;
}

/**
 * Preview component for extreme matrix enhancement
 * Shows 3 variants: Original (cropped), Reflectie Filter, Zwart/Wit
 */
export const ExtremeEnhancementPreview = React.memo(({
  variants,
  hubDetected,
  cropApplied,
  qualityScore,
  reflectionLevel,
  className
}: ExtremeEnhancementPreviewProps) => {
  const [activeTab, setActiveTab] = useState<string>('binarized');

  const getQualityBadge = () => {
    if (!qualityScore) return null;
    const config = {
      excellent: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Uitstekend' },
      good: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle, label: 'Goed' },
      fair: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertCircle, label: 'Matig' },
      poor: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle, label: 'Slecht' },
    };
    const { color, icon: Icon, label } = config[qualityScore];
    return (
      <Badge variant="outline" className={cn('text-xs', color)}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quality indicators */}
      <div className="flex flex-wrap gap-2">
        {getQualityBadge()}
        {hubDetected && (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs">
            Hub gedetecteerd
          </Badge>
        )}
        {cropApplied && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
            Matrix ring gecroppt
          </Badge>
        )}
        {reflectionLevel !== undefined && reflectionLevel > 40 && (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
            Zware reflecties ({Math.round(reflectionLevel)}%)
          </Badge>
        )}
      </div>

      {/* Tabs for different variants */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="original" className="text-xs px-2">
            <Eye className="h-3 w-3 mr-1" />
            Origineel
          </TabsTrigger>
          <TabsTrigger value="minChannel" className="text-xs px-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Reflectie Filter
          </TabsTrigger>
          <TabsTrigger value="binarized" className="text-xs px-2">
            <Binary className="h-3 w-3 mr-1" />
            Zwart/Wit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="original" className="mt-2">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <img 
              src={variants.original} 
              alt="Origineel (gecroppt)" 
              className="w-full h-auto object-contain max-h-64"
            />
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 text-xs bg-black/70 text-white border-0"
            >
              Origineel {cropApplied ? '(gecroppt)' : ''}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Originele afbeelding, eventueel gecroppt naar matrix ring gebied
          </p>
        </TabsContent>

        <TabsContent value="minChannel" className="mt-2">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <img 
              src={variants.minChannel} 
              alt="Reflectie filter" 
              className="w-full h-auto object-contain max-h-64"
            />
            <Badge 
              className="absolute top-2 left-2 text-xs bg-primary/90 text-primary-foreground border-0"
            >
              Reflectie onderdrukt
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Min-channel filter onderdrukt regenboog reflecties
          </p>
        </TabsContent>

        <TabsContent value="binarized" className="mt-2">
          <div className="relative rounded-lg overflow-hidden bg-white">
            <img 
              src={variants.binarized} 
              alt="Zwart/Wit binarisatie" 
              className="w-full h-auto object-contain max-h-64"
            />
            <Badge 
              className="absolute top-2 left-2 text-xs bg-gray-900 text-white border-0"
            >
              Hoog contrast
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Adaptieve binarisatie maakt vage gravures zichtbaar
          </p>
        </TabsContent>
      </Tabs>

      {/* Processing info */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
        <p className="font-medium mb-1">💡 Tip: Zwart/Wit variant</p>
        <p>De AI analyseert alle 3 varianten en combineert de beste resultaten voor maximale nauwkeurigheid.</p>
      </div>
    </div>
  );
});

ExtremeEnhancementPreview.displayName = 'ExtremeEnhancementPreview';
