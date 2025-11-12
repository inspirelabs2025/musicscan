import React from 'react';
import { Disc3, ArrowRight, Hash, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface QuickScanOptionsProps {
  context?: 'collection' | 'shop';
  className?: string;
}

export const QuickScanOptions = React.memo(({ context = 'collection', className = '' }: QuickScanOptionsProps) => {
  const navigate = useNavigate();

  const handleScanType = (type: 'vinyl' | 'cd') => {
    console.log('QuickScanOptions clicked:', type, 'context:', context);
    const returnTo = context === 'shop' ? 'shop' : 'collection';
    navigate(`/scanner?type=${type}&returnTo=${returnTo}`);
  };

  const handleDiscogsId = () => {
    console.log('QuickScanOptions clicked: discogs', 'context:', context);
    const returnTo = context === 'shop' ? 'shop' : 'collection';
    navigate(`/scanner?discogs=true&returnTo=${returnTo}`);
  };

  const getContextText = () => {
    if (context === 'shop') {
      return {
        title: 'Scan Items voor Winkel',
        description: 'Scan nieuwe items met directe waarde berekening en voeg ze toe aan je winkel.'
      };
    }
    return {
      title: 'Voeg Items toe aan Collectie',
      description: 'Scan nieuwe items met smart herkenning en directe waarde berekening.'
    };
  };

  const contextText = getContextText();

  return (
    <div className={className}>
      <Card className="border-accent/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center gap-3 justify-center text-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-vinyl flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-white" />
            </div>
            {contextText.title}
          </CardTitle>
          <CardDescription className="text-sm max-w-xl mx-auto">
            {contextText.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vinyl Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-vinyl-purple/30 hover:scale-105 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
              <CardContent className="p-4 text-center" onClick={() => handleScanType('vinyl')}>
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:animate-vinyl-spin transition-transform">
                  <Disc3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">Vinyl Records</h3>
                <p className="text-muted-foreground text-sm mb-3">LP / Single / EP</p>
                <div className="space-y-1 mb-3">
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
              <CardContent className="p-4 text-center" onClick={() => handleScanType('cd')}>
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Disc3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">Compact Discs</h3>
                <p className="text-muted-foreground text-sm mb-3">Album / Single / EP</p>
                <div className="space-y-1 mb-3">
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
              <CardContent className="p-4 text-center" onClick={handleDiscogsId}>
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:pulse transition-transform">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">Discogs ID</h3>
                <p className="text-muted-foreground text-sm mb-3">Direct prijscheck</p>
                <div className="space-y-1 mb-3">
                  <Badge variant="outline" className="text-xs flex items-center gap-1 justify-center">
                    <Zap className="w-3 h-3" />
                    Supersnel
                  </Badge>
                </div>
                <Button className="w-full group-hover:bg-green-600" size="sm">
                  Discogs ID
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

QuickScanOptions.displayName = 'QuickScanOptions';