import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArtistContentCards } from '@/components/scanner/ArtistContentCards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface TrackMeta {
  artist: string;
  title: string;
  album?: string;
  year?: number;
  spotify_track_id?: string;
}

export default function SpotifyTrackDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support both slug-based (SEO) and legacy query-param URLs
  const qArtist = searchParams.get('artist') || '';
  const qTitle = searchParams.get('title') || '';
  const qAlbum = searchParams.get('album') || '';
  const qYear = searchParams.get('year') || '';
  const qImage = searchParams.get('image') || '';
  const qUrl = searchParams.get('url') || '';
  const qTrackId = searchParams.get('trackId') || '';

  const [insights, setInsights] = useState<TrackInsights | null>(null);
  const [trackMeta, setTrackMeta] = useState<TrackMeta>({ artist: qArtist, title: qTitle, album: qAlbum, year: qYear ? parseInt(qYear) : undefined });
  const [imageUrl, setImageUrl] = useState(qImage);
  const [spotifyUrl, setSpotifyUrl] = useState(qUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const artist = trackMeta.artist;
  const title = trackMeta.title;
  const album = trackMeta.album;
  const year = trackMeta.year;

  useEffect(() => {
    if (!slug) return;

    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try loading from DB by slug (fast, cached)
        const { data: dbRow } = await supabase
          .from('spotify_track_insights')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (dbRow) {
          setInsights(dbRow.insights_data as unknown as TrackInsights);
          setTrackMeta({
            artist: dbRow.artist,
            title: dbRow.title,
            album: dbRow.album || undefined,
            year: dbRow.year || undefined,
            spotify_track_id: dbRow.spotify_track_id,
          });
          setLoading(false);
          return;
        }

        // Fallback: if we have query params (navigated from profile), call edge function
        if (qArtist && qTitle && qTrackId) {
          const { data, error: fnError } = await supabase.functions.invoke('spotify-track-info', {
            body: {
              spotify_track_id: qTrackId,
              artist: qArtist,
              title: qTitle,
              album: qAlbum || undefined,
              year: qYear ? parseInt(qYear) : undefined,
            }
          });

          if (fnError) throw new Error(fnError.message);
          if (!data?.success) throw new Error(data?.error || 'Analyse mislukt');

          setInsights(data.insights);
          // Redirect to clean slug URL if we got one
          if (data.slug && data.slug !== slug) {
            navigate(`/nummer/${data.slug}`, { replace: true });
          }
        } else {
          setError('Track niet gevonden');
        }
      } catch (err: any) {
        console.error('Track insights error:', err);
        setError(err.message || 'Kon informatie niet laden');
        toast.error('Kon track informatie niet laden');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [slug]);

  const pageTitle = title && artist ? `${title} - ${artist} | MusicScan` : 'Track Analyse | MusicScan';
  const pageDescription = insights?.summary || `Ontdek het verhaal achter ${title || 'dit nummer'} van ${artist || 'de artiest'}. Achtergrond, muzikale analyse en weetjes.`;
  const canonicalUrl = `https://www.musicscan.app/nummer/${slug}`;

  // JSON-LD Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: title,
    byArtist: {
      '@type': 'MusicGroup',
      name: artist,
    },
    ...(album && {
      inAlbum: {
        '@type': 'MusicAlbum',
        name: album,
      }
    }),
    ...(year && { datePublished: String(year) }),
    ...(imageUrl && { image: imageUrl }),
    url: canonicalUrl,
    description: pageDescription,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription.substring(0, 160)} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription.substring(0, 160)} />
        <meta property="og:type" content="music.song" />
        <meta property="og:url" content={canonicalUrl} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription.substring(0, 160)} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back button */}
          <Button variant="ghost" onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/spotify-profile');
            }
          }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Terug
          </Button>

          {/* Hero */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#1DB954] via-[#15803d] to-[#191414] p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {imageUrl ? (
                  <img src={imageUrl} alt={`${title} - ${artist}`} className="w-40 h-40 rounded-lg shadow-2xl object-cover" />
                ) : (
                  <div className="w-40 h-40 bg-white/10 rounded-lg flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="text-center md:text-left text-white flex-1">
                  <h1 className="text-3xl font-bold">{title || 'Track laden...'}</h1>
                  <p className="text-xl text-white/80 mt-1">{artist}</p>
                  {album && <p className="text-white/60 mt-1 flex items-center gap-1"><Disc3 className="w-4 h-4" /> {album}</p>}
                  {year && <Badge className="mt-2 bg-white/20 text-white border-0">{String(year)}</Badge>}
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
            <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-fade-in">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-[#1DB954]/20 animate-[pulse_2s_ease-in-out_infinite]" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 animate-[spin_3s_linear_infinite] shadow-xl">
                  <div className="absolute inset-3 rounded-full border border-zinc-700/40" />
                  <div className="absolute inset-5 rounded-full border border-zinc-700/30" />
                  <div className="absolute inset-7 rounded-full border border-zinc-700/20" />
                  <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-[#1DB954] to-[#15803d] flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-[#1DB954] animate-[pulse_1.5s_ease-in-out_infinite]" />
                <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-[#1DB954]/60 animate-[pulse_2s_ease-in-out_0.5s_infinite]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">Slimme analyse wordt gegenereerd</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-[bounce_1s_ease-in-out_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  We duiken in het verhaal achter <span className="font-semibold text-[#1DB954]">{title || 'dit nummer'}</span>
                </p>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#1DB954]" /> Samenvatting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{insights.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#1DB954]" /> Het Verhaal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed whitespace-pre-line">{insights.background}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Mic2 className="w-5 h-5 text-[#1DB954]" /> Over de Artiest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.artistInfo}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Music className="w-5 h-5 text-[#1DB954]" /> Muzikale Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.musicalAnalysis}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Globe className="w-5 h-5 text-[#1DB954]" /> Culturele Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.culturalImpact}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Heart className="w-5 h-5 text-[#1DB954]" /> Thema & Tekst</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.lyrics_theme}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-[#1DB954]" /> Tijdperk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{insights.era}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Gerelateerde content van artiest */}
              {artist && (
                <>
                  <Separator className="my-4" />
                  <ArtistContentCards artistName={artist} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
