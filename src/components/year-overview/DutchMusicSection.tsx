import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flag } from 'lucide-react';

interface DutchMusicSectionProps {
  narrative: string;
  highlights: string[];
  topArtists: string[];
  edisonWinners: Array<{ category: string; winner: string }>;
}

export const DutchMusicSection: React.FC<DutchMusicSectionProps> = ({ 
  narrative, 
  highlights, 
  topArtists,
  edisonWinners 
}) => {
  if (!narrative && highlights?.length === 0 && topArtists?.length === 0) return null;

  return (
    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🇳🇱</span>
          Nederlandse Muziek
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground">{narrative}</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Highlights */}
          {highlights && highlights.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                ⭐ Hoogtepunten
              </h3>
              <ul className="space-y-1">
                {highlights.slice(0, 5).map((highlight, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Top Artists */}
          {topArtists && topArtists.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                🎤 Top Nederlandse Artiesten
              </h3>
              <div className="flex flex-wrap gap-2">
                {topArtists.slice(0, 8).map((artist, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 text-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edison Winners */}
        {edisonWinners && edisonWinners.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              🏆 Edison Awards
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {edisonWinners.slice(0, 6).map((winner, index) => (
                <div key={index} className="text-sm flex justify-between gap-2 py-1">
                  <span className="text-muted-foreground">{winner.category}</span>
                  <span className="font-medium">{winner.winner}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
