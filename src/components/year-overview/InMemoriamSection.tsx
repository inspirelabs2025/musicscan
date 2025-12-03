import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { InMemoriamArtist } from '@/hooks/useYearOverview';

interface InMemoriamSectionProps {
  narrative: string;
  artists: InMemoriamArtist[];
}

export const InMemoriamSection: React.FC<InMemoriamSectionProps> = ({ narrative, artists }) => {
  if (!narrative && (!artists || artists.length === 0)) return null;

  return (
    <Card className="border-muted bg-gradient-to-br from-muted/30 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-400" />
          💔 In Memoriam
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground italic">{narrative}</p>
        )}
        
        {artists && artists.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {artist.image_url ? (
                    <img 
                      src={artist.image_url} 
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover grayscale"
                    />
                  ) : (
                    <span className="text-lg">🕯️</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{artist.name}</h3>
                  <p className="text-xs text-muted-foreground">{artist.years}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {artist.known_for}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
