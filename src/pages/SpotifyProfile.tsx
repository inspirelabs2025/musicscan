import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Headphones, Music, PlayCircle, BarChart3, User, ExternalLink, 
  Clock, TrendingUp, Globe, Users, Disc3, Sparkles
} from 'lucide-react';
import { SpotifyConnect } from '@/components/SpotifyConnect';
import { useSpotifyPlaylists, useSpotifyTopTracks, useSpotifyTopArtists, useSpotifyStats } from '@/hooks/useSpotifyData';
import { useSpotifyRecentlyPlayed, useSpotifyAudioFeatures } from '@/hooks/useSpotifyRecentlyPlayed';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DECADE_COLORS = ['#1DB954', '#1ed760', '#169c46', '#0d6b31', '#15803d', '#22c55e', '#4ade80', '#86efac'];

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function formatPlayedAt(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m geleden`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}u geleden`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d geleden`;
}

export default function SpotifyProfile() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: playlists } = useSpotifyPlaylists();
  const { data: topTracks } = useSpotifyTopTracks();
  const { data: topArtists } = useSpotifyTopArtists();
  const { data: spotifyStats } = useSpotifyStats();
  const { data: recentlyPlayed } = useSpotifyRecentlyPlayed(20);
  const { data: audioFeatures } = useSpotifyAudioFeatures();
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');

  const isConnected = (profile as any)?.spotify_connected || false;
  const spotifyAvatar = (profile as any)?.spotify_avatar_url;
  const spotifyName = (profile as any)?.spotify_display_name;
  const spotifyCountry = (profile as any)?.spotify_country;
  const spotifyFollowers = (profile as any)?.spotify_followers;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Spotify Integratie</h1>
              <p className="text-muted-foreground">Verbind je Spotify account om je muziekprofiel te verrijken</p>
            </div>
            <SpotifyConnect />
          </div>
        </div>
      </div>
    );
  }

  // Calculate decade distribution from tracks
  const decadeData = spotifyStats?.recentActivity ? (() => {
    const allTracks = spotifyStats.recentActivity;
    // We need tracks from useSpotifyStats which has year info
    return [];
  })() : [];

  const timeRangeLabels = {
    short_term: 'Laatste 4 weken',
    medium_term: 'Laatste 6 maanden',
    long_term: 'Alle tijd'
  };

  // Generate music DNA summary
  const musicDNA = audioFeatures ? (() => {
    const traits: string[] = [];
    if (audioFeatures.energy > 70) traits.push('energiek');
    else if (audioFeatures.energy < 30) traits.push('rustig');
    if (audioFeatures.danceability > 70) traits.push('dansbaar');
    if (audioFeatures.valence > 70) traits.push('vrolijk');
    else if (audioFeatures.valence < 30) traits.push('melancholisch');
    if (audioFeatures.acousticness > 60) traits.push('akoestisch');
    if (audioFeatures.instrumentalness > 40) traits.push('instrumentaal');
    if (audioFeatures.speechiness > 30) traits.push('vocaal');
    
    const tempoLabel = audioFeatures.tempo > 140 ? 'snel' : audioFeatures.tempo > 100 ? 'gemiddeld' : 'langzaam';
    
    return {
      traits,
      tempoLabel,
      summary: traits.length > 0 
        ? `Je muziek is overwegend ${traits.slice(0, 3).join(', ')} met een ${tempoLabel} tempo (${audioFeatures.tempo} BPM).`
        : `Je luistert naar een gevarieerd muziekpalet met een gemiddeld tempo van ${audioFeatures.tempo} BPM.`
    };
  })() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* === Profile Header === */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#1DB954] to-[#191414] p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {spotifyAvatar ? (
                  <img src={spotifyAvatar} alt="Spotify avatar" className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20">
                    <User className="w-12 h-12 text-white/70" />
                  </div>
                )}
                <div className="text-center md:text-left text-white">
                  <h1 className="text-3xl font-bold">{spotifyName || 'Spotify Gebruiker'}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-white/80">
                    {spotifyCountry && (
                      <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{spotifyCountry}</span>
                    )}
                    {spotifyFollowers !== undefined && spotifyFollowers !== null && (
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{spotifyFollowers} volgers</span>
                    )}
                    {spotifyStats && (
                      <>
                        <span className="flex items-center gap-1"><Music className="w-4 h-4" />{spotifyStats.totalTracks} tracks</span>
                        <span className="flex items-center gap-1"><Disc3 className="w-4 h-4" />{spotifyStats.totalPlaylists} playlists</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* === Stat Cards === */}
          {spotifyStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracks</p>
                    <p className="text-2xl font-bold text-[#1DB954]">{spotifyStats.totalTracks}</p>
                  </div>
                  <Music className="w-8 h-8 text-[#1DB954]/50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Playlists</p>
                    <p className="text-2xl font-bold text-[#1DB954]">{spotifyStats.totalPlaylists}</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-[#1DB954]/50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gem. Duur</p>
                    <p className="text-2xl font-bold text-[#1DB954]">
                      {spotifyStats.avgDurationMs > 0 ? formatDuration(spotifyStats.avgDurationMs) : '0:00'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-[#1DB954]/50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Explicit</p>
                    <p className="text-2xl font-bold text-[#1DB954]">{spotifyStats.explicitPercentage}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#1DB954]/50" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* === Main Tabs === */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="top-music">Top Muziek</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* === OVERVIEW TAB === */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Genres */}
                {spotifyStats?.topGenres && spotifyStats.topGenres.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" /> Top Genres
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {spotifyStats.topGenres.map((genre, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-[#1DB954]/10 text-[#1DB954]">{genre.genre}</Badge>
                            <span className="text-sm text-muted-foreground">{genre.count} tracks</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recently Played */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Recent Beluisterd
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentlyPlayed && recentlyPlayed.length > 0 ? (
                      <div className="space-y-3">
                        {recentlyPlayed.slice(0, 8).map((track, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            {track.image_url ? (
                              <img src={track.image_url} alt={track.title} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-[#1DB954]/10 rounded flex items-center justify-center">
                                <PlayCircle className="w-5 h-5 text-[#1DB954]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{track.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatPlayedAt(track.played_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Nog geen recent beluisterde tracks. Synchroniseer je data.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* === TOP MUSIC TAB === */}
            <TabsContent value="top-music" className="space-y-6">
              <div className="flex justify-center">
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="short_term">4 weken</TabsTrigger>
                    <TabsTrigger value="medium_term">6 maanden</TabsTrigger>
                    <TabsTrigger value="long_term">Alle tijd</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" /> Top Tracks - {timeRangeLabels[timeRange]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topTracks && topTracks.length > 0 ? (
                      <div className="space-y-3">
                        {topTracks.slice(0, 10).map((track, index) => (
                          <div key={track.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#1DB954]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#1DB954]">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{(track.data as any)?.artist}</p>
                            </div>
                            {(track.data as any)?.spotify_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={(track.data as any).spotify_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Geen top tracks gevonden</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" /> Top Artiesten - {timeRangeLabels[timeRange]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topArtists && topArtists.length > 0 ? (
                      <div className="space-y-3">
                        {topArtists.slice(0, 10).map((artist, index) => (
                          <div key={artist.id} className="flex items-center space-x-3">
                            {(artist.data as any)?.image_url ? (
                              <img src={(artist.data as any).image_url} alt={artist.name}
                                className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-[#1DB954]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#1DB954]">
                                {index + 1}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{artist.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {((artist.data as any)?.genres || []).slice(0, 2).map((genre: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{genre}</Badge>
                                ))}
                              </div>
                            </div>
                            {(artist.data as any)?.spotify_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={(artist.data as any).spotify_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Geen top artiesten gevonden</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* === PLAYLISTS TAB === */}
            <TabsContent value="playlists" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" /> Mijn Playlists
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
                                <img src={playlist.image_url} alt={playlist.name} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-[#1DB954]/10 rounded-lg flex items-center justify-center">
                                  <Music className="w-6 h-6 text-[#1DB954]" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{playlist.name}</p>
                                <p className="text-sm text-muted-foreground">{playlist.track_count} tracks</p>
                                {playlist.is_public && <Badge variant="outline" className="text-xs mt-1">Publiek</Badge>}
                              </div>
                              {playlist.spotify_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={playlist.spotify_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Geen playlists gevonden</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === INSIGHTS TAB === */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audio Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" /> Audio Profiel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audioFeatures ? (
                      <div className="space-y-4">
                        {[
                          { label: 'Danceability', value: audioFeatures.danceability, emoji: '💃' },
                          { label: 'Energy', value: audioFeatures.energy, emoji: '⚡' },
                          { label: 'Vrolijkheid', value: audioFeatures.valence, emoji: '😊' },
                          { label: 'Akoestisch', value: audioFeatures.acousticness, emoji: '🎸' },
                          { label: 'Instrumentaal', value: audioFeatures.instrumentalness, emoji: '🎹' },
                          { label: 'Liveness', value: audioFeatures.liveness, emoji: '🎤' },
                        ].map((feature) => (
                          <div key={feature.label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{feature.emoji} {feature.label}</span>
                              <span className="font-medium">{feature.value}%</span>
                            </div>
                            <Progress value={feature.value} className="h-2" />
                          </div>
                        ))}
                        <div className="pt-2 border-t text-sm text-muted-foreground">
                          <span className="font-medium">Gemiddeld tempo:</span> {audioFeatures.tempo} BPM
                          <br />
                          <span className="text-xs">Gebaseerd op {audioFeatures.sample_size} top tracks</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Synchroniseer je data om audio analyses te zien
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Music DNA */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Jouw Muziek-DNA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {musicDNA ? (
                      <>
                        <div className="bg-gradient-to-r from-[#1DB954]/10 to-[#191414]/5 p-4 rounded-lg">
                          <p className="text-sm leading-relaxed">{musicDNA.summary}</p>
                        </div>
                        {musicDNA.traits.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {musicDNA.traits.map((trait) => (
                              <Badge key={trait} className="bg-[#1DB954] text-white">{trait}</Badge>
                            ))}
                          </div>
                        )}
                        {spotifyStats?.topArtists && spotifyStats.topArtists.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Meest geluisterde artiesten</h4>
                            <div className="flex flex-wrap gap-2">
                              {spotifyStats.topArtists.slice(0, 5).map((a) => (
                                <Badge key={a.artist} variant="outline">{a.artist}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Synchroniseer je data om je Muziek-DNA te ontdekken</p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Data Synchronisatie</p>
                        <p className="text-xs text-muted-foreground">Automatisch via Spotify</p>
                      </div>
                      <Badge variant="outline" className="text-[#1DB954]">Actief</Badge>
                    </div>
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
