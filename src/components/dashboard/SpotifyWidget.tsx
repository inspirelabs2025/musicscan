import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Headphones, 
  Music, 
  PlayCircle, 
  TrendingUp,
  ExternalLink,
  Plus,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSpotifyStats } from '@/hooks/useSpotifyData';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export function SpotifyWidget() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: spotifyStats } = useSpotifyStats();
  const { connectSpotify, syncSpotifyData, isConnecting } = useSpotifyAuth();
  
  const [needsReauth, setNeedsReauth] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  const isConnected = (profile as any)?.spotify_connected || false;
  const spotifyDisplayName = (profile as any)?.spotify_display_name;

  if (!isConnected) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Spotify Connect</CardTitle>
              <CardDescription className="text-sm">
                Verrijk je muziekprofiel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="mb-4">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Koppel je Spotify account voor verbeterde AI analyses en quiz vragen
              </p>
            </div>
            <Button 
              onClick={connectSpotify}
              disabled={isConnecting}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verbinden...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Koppel Spotify
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Spotify</CardTitle>
              <CardDescription className="text-sm">
                Verbonden als {spotifyDisplayName}
              </CardDescription>
            </div>
          </div>
          {needsReauth ? (
            <Button
              onClick={() => {
                setNeedsReauth(false);
                connectSpotify();
              }}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reauth
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setIsSyncing(true);
                const result = await syncSpotifyData();
                if (result?.needsReauth) {
                  setNeedsReauth(true);
                }
                setIsSyncing(false);
              }}
              disabled={isSyncing}
              className="h-8 w-8 p-0"
            >
              {isSyncing ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {needsReauth && (
        <CardContent className="pt-0">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Autorisatie verlopen</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Verbind opnieuw met Spotify voor actuele data.
            </p>
          </div>
        </CardContent>
      )}
      
      {spotifyStats && !needsReauth && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{spotifyStats.totalTracks}</div>
              <div className="text-xs text-muted-foreground">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{spotifyStats.totalPlaylists}</div>
              <div className="text-xs text-muted-foreground">Playlists</div>
            </div>
          </div>

          {spotifyStats.topGenres.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Top Genres</h4>
              <div className="flex flex-wrap gap-1">
                {spotifyStats.topGenres.slice(0, 3).map((genre, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                    {genre.genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {spotifyStats.recentActivity && spotifyStats.recentActivity.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Recent Toegevoegd</h4>
              <div className="space-y-1">
                {spotifyStats.recentActivity.slice(0, 2).map((track, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <PlayCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="truncate">{track.artist} - {track.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-xs"
              onClick={() => window.open('/spotify-profile', '_self')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Bekijk Details
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}