import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Music, 
  Headphones, 
  PlayCircle, 
  Users, 
  TrendingUp,
  RefreshCw,
  Unlink,
  ExternalLink,
  Copy,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useSpotifyStats } from '@/hooks/useSpotifyData';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function SpotifyConnect() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { connectSpotify, disconnectSpotify, syncSpotifyData, isConnecting, isDisconnecting, getManualSpotifyUrl } = useSpotifyAuth();
  const { data: spotifyStats } = useSpotifyStats();
  const [needsReauth, setNeedsReauth] = useState(false);
  
  useEffect(() => {
    // Handle Spotify OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && window.location.pathname === '/auth/spotify/callback') {
      // This would be handled by a separate callback page in a real implementation
      // For now, we'll just show a message
      toast.info('Spotify authenticatie gedetecteerd. Verwerking...');
    }
  }, []);

  const isConnected = profile?.spotify_connected || false;
  const spotifyDisplayName = profile?.spotify_display_name;
  const lastSync = profile?.spotify_last_sync;

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Zojuist';
    if (diffInHours < 24) return `${diffInHours} uur geleden`;
    return `${Math.floor(diffInHours / 24)} dagen geleden`;
  };

  const handleSync = async () => {
    const result = await syncSpotifyData();
    if (result?.needsReauth) {
      setNeedsReauth(true);
    } else if (result?.success) {
      setNeedsReauth(false);
    }
  };

  const handleReauth = () => {
    setNeedsReauth(false);
    connectSpotify();
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Koppel je Spotify Account</CardTitle>
          <CardDescription className="text-lg">
            Verbind je Spotify account om je muziekprofiel te verrijken en betere AI analyses te krijgen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <PlayCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Luistergewoonten</h4>
                <p className="text-sm text-muted-foreground">
                  Analyseer je top tracks en artiesten
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Verbeterde Quiz</h4>
                <p className="text-sm text-muted-foreground">
                  Vragen over je Spotify bibliotheek
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Music className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Playlist Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Ontdek patronen in je playlists
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Sociale Features</h4>
                <p className="text-sm text-muted-foreground">
                  Vergelijk je smaak met vrienden
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-center space-y-4">
            <Button 
              onClick={connectSpotify}
              disabled={isConnecting}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white px-8"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verbinden...
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 mr-2" />
                  Verbind met Spotify
                </>
              )}
            </Button>
            
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
              <p className="font-medium">Voor Spotify Developer Dashboard:</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 font-mono bg-background p-2 rounded border break-all">
                  {window.location.origin}/auth/spotify/callback
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth/spotify/callback`);
                    toast.success('Redirect URI gekopieerd!');
                  }}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Voeg deze URI toe onder "Redirect URIs" in je Spotify app instellingen
              </p>
              {window.location.hostname.includes('lovableproject.com') && (
                <p className="text-xs text-amber-600">
                  💡 Test ook op je live domein voor productie gebruik
                </p>
              )}
            </div>
            
            {isConnecting && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-amber-600">Als je een "Invalid redirect URI" fout krijgt:</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-left max-w-md mx-auto">
                  <li>Controleer of bovenstaande URI is toegevoegd in Spotify Developer Dashboard</li>
                  <li>Klik "Save" in je Spotify app instellingen</li>
                  <li>Voeg jezelf toe als test gebruiker als de app in Development mode staat</li>
                  <li>Wacht 1-2 minuten na het opslaan voordat je opnieuw probeert</li>
                </ul>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Door te verbinden met Spotify ga je akkoord met het delen van je luistergegevens. 
            Je kunt deze koppeling altijd verbreken.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Spotify Gekoppeld</CardTitle>
              <CardDescription>
                Verbonden als <span className="font-semibold">{spotifyDisplayName}</span>
                {lastSync && (
                  <span className="block text-xs mt-1">
                    Laatste sync: {formatLastSync(lastSync)}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {needsReauth ? (
              <Button onClick={handleReauth} variant="default" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Herautoriseer Spotify
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isConnecting}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectSpotify}
              disabled={isDisconnecting}
            >
              <Unlink className="w-4 h-4 mr-1" />
              Verbreek
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {needsReauth && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Autorisatie verlopen</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Je Spotify verbinding moet worden vernieuwd. Klik op "Herautoriseer Spotify" om opnieuw te verbinden.
            </p>
          </div>
        )}
        
        {spotifyStats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{spotifyStats.totalTracks}</div>
                <div className="text-sm text-muted-foreground">Tracks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{spotifyStats.totalPlaylists}</div>
                <div className="text-sm text-muted-foreground">Playlists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {spotifyStats.avgDurationMs > 0 ? formatDuration(spotifyStats.avgDurationMs) : '0:00'}
                </div>
                <div className="text-sm text-muted-foreground">Gem. Duur</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{spotifyStats.explicitPercentage}%</div>
                <div className="text-sm text-muted-foreground">Explicit</div>
              </div>
            </div>

            <Separator />

            {spotifyStats.topGenres.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  Top Genres
                </h4>
                <div className="flex flex-wrap gap-2">
                  {spotifyStats.topGenres.map((genre, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {genre.genre} ({genre.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {spotifyStats.topArtists.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Top Artiesten (uit bibliotheek)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {spotifyStats.topArtists.slice(0, 6).map((artist, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-medium">{artist.artist}</span>
                      <Badge variant="outline">{artist.count} tracks</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center">
            Deze gegevens worden gebruikt om je muziek DNA en quiz ervaring te verbeteren.
            <Button variant="link" className="p-0 h-auto ml-1" size="sm">
              <ExternalLink className="w-3 h-3 mr-1" />
              Bekijk op Spotify
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}