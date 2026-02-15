import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, ExternalLink, Music, Disc3, Clock, Star,
  Lightbulb, BookOpen, Mic2, Globe, Sparkles, Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackInsights {
  summary: string;
  background: string;
  artistInfo: string;
  musicalAnalysis: string;
  culturalImpact: string;
  funFacts: string[];
  relatedTracks: string[];
  era: string;
  lyrics_theme: string;
}

export default function SpotifyTrackDetail() {
  const { trackId } = useParams<{ trackId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const artist = searchParams.get('artist') || '';
  const title = searchParams.get('title') || '';
  const album = searchParams.get('album') || '';
  const year = searchParams.get('year') || '';
  const imageUrl = searchParams.get('image') || '';
  const spotifyUrl = searchParams.get('url') || '';

  const [insights, setInsights] = useState<TrackInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId || !artist || !title) return;

    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('spotify-track-info', {
          body: {
            spotify_track_id: trackId,
            artist,
            title,
            album: album || undefined,
            year: year ? parseInt(year) : undefined,
          }
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || 'Analyse mislukt');

        setInsights(data.insights);
      } catch (err: any) {
        console.error('Track insights error:', err);
        setError(err.message || 'Kon informatie niet laden');
        toast.error('Kon track informatie niet laden');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [trackId, artist, title, album, year]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Terug
          </Button>

          {/* Hero */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#1DB954] via-[#15803d] to-[#191414] p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="w-40 h-40 rounded-lg shadow-2xl object-cover" />
                ) : (
                  <div className="w-40 h-40 bg-white/10 rounded-lg flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="text-center md:text-left text-white flex-1">
                  <h1 className="text-3xl font-bold">{title}</h1>
                  <p className="text-xl text-white/80 mt-1">{artist}</p>
                  {album && <p className="text-white/60 mt-1 flex items-center gap-1"><Disc3 className="w-4 h-4" /> {album}</p>}
                  {year && <Badge className="mt-2 bg-white/20 text-white border-0">{year}</Badge>}
                  {spotifyUrl && (
                    <Button variant="secondary" size="sm" className="mt-4 gap-2" asChild>
                      <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Luister op Spotify
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              <Card><CardContent className="p-6"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
              <div className="text-center text-muted-foreground py-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" /> Slimme analyse wordt gegenereerd...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <Card><CardContent className="p-6 text-center text-destructive">{error}</CardContent></Card>
          )}

          {/* Insights */}
          {insights && !loading && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#1DB954]" /> Samenvatting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{insights.summary}</p>
                </CardContent>
              </Card>

              {/* Background Story */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#1DB954]" /> Het Verhaal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed whitespace-pre-line">{insights.background}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Artist Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Mic2 className="w-5 h-5 text-[#1DB954]" /> Over de Artiest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.artistInfo}</p>
                  </CardContent>
                </Card>

                {/* Musical Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Music className="w-5 h-5 text-[#1DB954]" /> Muzikale Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.musicalAnalysis}</p>
                  </CardContent>
                </Card>

                {/* Cultural Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Globe className="w-5 h-5 text-[#1DB954]" /> Culturele Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.culturalImpact}</p>
                  </CardContent>
                </Card>

                {/* Lyrics Theme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Heart className="w-5 h-5 text-[#1DB954]" /> Thema & Tekst</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.lyrics_theme}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Era */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-[#1DB954]" /> Tijdperk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{insights.era}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fun Facts */}
                {insights.funFacts?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="w-5 h-5 text-[#1DB954]" /> Weetjes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.funFacts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Star className="w-4 h-4 text-[#1DB954] mt-0.5 shrink-0" />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Related Tracks */}
                {insights.relatedTracks?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Disc3 className="w-5 h-5 text-[#1DB954]" /> Gerelateerde Nummers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.relatedTracks.map((track, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                            {track}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
