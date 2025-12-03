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
          <div className="grid md:grid-cols-2 gap-4">
            {artists.map((artist, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-background/50"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {artist.image_url ? (
                    <img 
                      src={artist.image_url} 
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover grayscale"
                    />
                  ) : (
                    <span className="text-2xl">🕯️</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{artist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {artist.years}
                    {artist.age && ` (${artist.age} jaar)`}
                  </p>
                  {artist.date_of_death && (
                    <p className="text-xs text-muted-foreground">
                      † {new Date(artist.date_of_death).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {artist.known_for}
                  </p>
                  {artist.notable_works && artist.notable_works.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Bekend van: {artist.notable_works.slice(0, 3).join(', ')}
                    </p>
                  )}
                  {artist.legacy && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{artist.legacy}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
