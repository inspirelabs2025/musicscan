import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { TopArtist } from '@/hooks/useYearOverview';

interface TopArtistsSectionProps {
  artists: TopArtist[];
}

export const TopArtistsSection: React.FC<TopArtistsSectionProps> = ({ artists }) => {
  if (!artists || artists.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          🎤 Top Artiesten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {artists.slice(0, 8).map((artist, index) => (
            <div 
              key={index}
              className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {artist.image_url ? (
                  <img 
                    src={artist.image_url} 
                    alt={artist.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {artist.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm truncate">{artist.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {artist.achievement}
              </p>
              {artist.genre && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {artist.genre}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
