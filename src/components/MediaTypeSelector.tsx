
import React from 'react';
import { Disc3, Hash, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MediaTypeSelectorProps {
  onSelectMediaType: (type: 'vinyl' | 'cd') => void;
  onSelectDiscogsId: () => void;
}

export const MediaTypeSelector = React.memo(({ onSelectMediaType, onSelectDiscogsId }: MediaTypeSelectorProps) => {
  const handleClick = (type: 'vinyl' | 'cd') => {
    console.log('MediaTypeSelector clicked:', type);
    onSelectMediaType(type);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-accent/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <CardTitle className="flex items-center gap-3 justify-center text-2xl md:text-3xl">
            <div className="w-12 h-12 rounded-full bg-gradient-vinyl flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-white" />
            </div>
            Wat ga je scannen?
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Kies het type media dat je wilt scannen en waarderen. Onze AI herkent automatisch alle belangrijke details.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vinyl Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-vinyl-purple/30 hover:scale-105 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
              <CardContent className="p-6 text-center" onClick={() => handleClick('vinyl')}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:animate-vinyl-spin transition-transform">
                  <Disc3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Vinyl Records</h3>
                <p className="text-muted-foreground mb-4">LP / Single / EP</p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Foto's: Voorkant, Achterkant, Matrix
                  </Badge>
                </div>
                <Button className="w-full group-hover:bg-purple-600" size="sm">
                  Scan Vinyl
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* CD Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500/30 hover:scale-105 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <CardContent className="p-6 text-center" onClick={() => handleClick('cd')}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Disc3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Compact Discs</h3>
                <p className="text-muted-foreground mb-4">Album / Single / EP</p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Foto's: Voorkant, Achterkant, Barcode, Matrix
                  </Badge>
                </div>
                <Button className="w-full group-hover:bg-blue-600" size="sm">
                  Scan CD
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Discogs ID Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-500/30 hover:scale-105 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
              <CardContent className="p-6 text-center" onClick={onSelectDiscogsId}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Hash className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Discogs ID</h3>
                <p className="text-muted-foreground mb-4">Direct prijscheck</p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-xs flex items-center justify-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Supersnel
                  </Badge>
                </div>
                <Button className="w-full group-hover:bg-green-600" size="sm">
                  Gebruik ID
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              💡 <strong>Tip:</strong> Voor de beste resultaten, zorg voor goede verlichting en scherpe foto's
            </p>
            <p className="text-xs text-muted-foreground">
              Gemiddelde scantijd: 30-60 seconden • Ondersteund: Nederlands, Engels, Duits, Frans
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MediaTypeSelector.displayName = 'MediaTypeSelector';
