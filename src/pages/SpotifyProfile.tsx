import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Headphones, 
  Music, 
  PlayCircle, 
  BarChart3,
  Calendar,
  User,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';
import { SpotifyConnect } from '@/components/SpotifyConnect';
import { useSpotifyPlaylists, useSpotifyTopTracks, useSpotifyTopArtists, useSpotifyStats } from '@/hooks/useSpotifyData';

export default function SpotifyProfile() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: playlists } = useSpotifyPlaylists();
  const { data: topTracks } = useSpotifyTopTracks();
  const { data: topArtists } = useSpotifyTopArtists();
  const { data: spotifyStats } = useSpotifyStats();
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');

  const isConnected = (profile as any)?.spotify_connected || false;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Spotify Integratie</h1>
              <p className="text-muted-foreground">
                Verbind je Spotify account om je muziekprofiel te verrijken
              </p>
            </div>
            <SpotifyConnect />
          </div>
        </div>
      </div>
    );
  }

  const timeRangeLabels = {
    short_term: 'Laatste 4 weken',
    medium_term: 'Laatste 6 maanden',
    long_term: 'Laatste jaren'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Headphones className="w-8 h-8 text-green-500" />
              Spotify Profiel
            </h1>
            <p className="text-muted-foreground">
              Ontdek je muziekprofiel via Spotify data
            </p>
          </div>

          {/* Spotify Connect Widget */}
          <SpotifyConnect />

          {/* Stats Overview */}
          {spotifyStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracks</p>
                    <p className="text-2xl font-bold">{spotifyStats.totalTracks}</p>
                  </div>
                  <Music className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Playlists</p>
                    <p className="text-2xl font-bold">{spotifyStats.totalPlaylists}</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gem. Duur</p>
                    <p className="text-2xl font-bold">
                      {spotifyStats.avgDurationMs > 0 
                        ? `${Math.floor(spotifyStats.avgDurationMs / 60000)}:${Math.floor((spotifyStats.avgDurationMs % 60000) / 1000).toString().padStart(2, '0')}`
                        : '0:00'
                      }
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Explicit</p>
                    <p className="text-2xl font-bold">{spotifyStats.explicitPercentage}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="top-music">Top Muziek</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Genres */}
                {spotifyStats?.topGenres && spotifyStats.topGenres.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Top Genres
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {spotifyStats.topGenres.map((genre, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {genre.genre}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{genre.count} tracks</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                {spotifyStats?.recentActivity && spotifyStats.recentActivity.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Toegevoegd
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {spotifyStats.recentActivity.slice(0, 5).map((track, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <PlayCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="top-music" className="space-y-6">
              {/* Time Range Selector */}
              <div className="flex justify-center">
                <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)} className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="short_term">4 weken</TabsTrigger>
                    <TabsTrigger value="medium_term">6 maanden</TabsTrigger>
                    <TabsTrigger value="long_term">Alle tijd</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tracks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Top Tracks - {timeRangeLabels[timeRange]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topTracks && topTracks.length > 0 ? (
                      <div className="space-y-3">
                        {topTracks.slice(0, 10).map((track, index) => (
                          <div key={track.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {(track.data as any)?.artist}
                              </p>
                            </div>
                            {(track.data as any)?.spotify_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a 
                                  href={(track.data as any).spotify_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Geen top tracks gevonden voor deze periode
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Artists */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Top Artiesten - {timeRangeLabels[timeRange]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topArtists && topArtists.length > 0 ? (
                      <div className="space-y-3">
                        {topArtists.slice(0, 10).map((artist, index) => (
                          <div key={artist.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{artist.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {((artist.data as any)?.genres || []).slice(0, 2).map((genre: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {(artist.data as any)?.spotify_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a 
                                  href={(artist.data as any).spotify_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Geen top artiesten gevonden voor deze periode
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="playlists" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    Mijn Playlists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {playlists && playlists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {playlists.map((playlist) => (
                        <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              {playlist.image_url ? (
                                <img 
                                  src={playlist.image_url} 
                                  alt={playlist.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Music className="w-6 h-6 text-green-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{playlist.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {playlist.track_count} tracks
                                </p>
                                {playlist.is_public && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Publiek
                                  </Badge>
                                )}
                              </div>
                              {playlist.spotify_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a 
                                    href={playlist.spotify_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            {playlist.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {playlist.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Geen playlists gevonden
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Muziek Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">🎵 Luisterpatronen</h4>
                      <p className="text-sm text-green-700">
                        Je Spotify data wordt gebruikt om betere AI analyses te maken van je muziekprofiel.
                        Deze data helpt bij het genereren van persoonlijke quiz vragen en muziek DNA insights.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Verbeteringen</h4>
                      <p className="text-sm text-blue-700">
                        Door je Spotify data te combineren met je fysieke collectie krijg je nog rijkere
                        AI analyses en meer uitdagende quiz vragen.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Instellingen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Data Synchronisatie</p>
                        <p className="text-sm text-muted-foreground">
                          Automatisch synchroniseren met Spotify
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Actief
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Quiz Integratie</p>
                        <p className="text-sm text-muted-foreground">
                          Spotify data gebruiken voor quiz vragen
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Ingeschakeld
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Spotify Instellingen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}