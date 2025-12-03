import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { ViralHit } from '@/hooks/useYearOverview';

interface StreamingViralSectionProps {
  narrative: string;
  viralHits: (string | ViralHit)[];
  streamingRecords: string[];
  spotifyWrapped?: {
    most_streamed_artist?: string;
    most_streamed_song?: string;
    most_streamed_album?: string;
  };
  tiktokTrends?: string[];
}

export const StreamingViralSection: React.FC<StreamingViralSectionProps> = ({ 
  narrative, 
  viralHits,
  streamingRecords,
  spotifyWrapped,
  tiktokTrends
}) => {
  if (!narrative && viralHits?.length === 0 && streamingRecords?.length === 0) return null;

  const getHitDisplay = (hit: string | ViralHit) => {
    if (typeof hit === 'string') return hit;
    return `${hit.artist} - ${hit.song}${hit.streams_millions ? ` (${hit.streams_millions}M streams)` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          📱 Streaming & Viraal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground">{narrative}</p>
        )}
        
        {/* Spotify Wrapped Stats */}
        {spotifyWrapped && (spotifyWrapped.most_streamed_artist || spotifyWrapped.most_streamed_song) && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              🎧 Spotify Wrapped
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              {spotifyWrapped.most_streamed_artist && (
                <div>
                  <span className="text-muted-foreground">Meest gestreamd artiest:</span>
                  <p className="font-medium">{spotifyWrapped.most_streamed_artist}</p>
                </div>
              )}
              {spotifyWrapped.most_streamed_song && (
                <div>
                  <span className="text-muted-foreground">Meest gestreamd nummer:</span>
                  <p className="font-medium">{spotifyWrapped.most_streamed_song}</p>
                </div>
              )}
              {spotifyWrapped.most_streamed_album && (
                <div>
                  <span className="text-muted-foreground">Meest gestreamd album:</span>
                  <p className="font-medium">{spotifyWrapped.most_streamed_album}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Viral Hits */}
          {viralHits && viralHits.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🔥 Virale Hits
              </h3>
              <div className="space-y-2">
                {viralHits.slice(0, 8).map((hit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{getHitDisplay(hit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Streaming Records */}
          {streamingRecords && streamingRecords.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                📊 Streaming Records
              </h3>
              <ul className="space-y-2">
                {streamingRecords.slice(0, 8).map((record, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">🏆</span>
                    {record}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* TikTok Trends */}
        {tiktokTrends && tiktokTrends.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              📲 TikTok Trends
            </h3>
            <div className="flex flex-wrap gap-2">
              {tiktokTrends.map((trend, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 text-sm bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full"
                >
                  #{trend}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
