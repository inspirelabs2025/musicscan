import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useArtistFanwall } from "@/hooks/useArtistFanwall";
import { useArtistPhotos } from "@/hooks/useArtistPhotos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Eye, Heart, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";

export default function ArtistFanWall() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: artist, isLoading: isLoadingArtist } = useArtistFanwall(slug || "");
  const {
    data,
    isLoading: isLoadingPhotos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArtistPhotos(artist?.artist_name || "", formatFilter);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const photos = data?.pages.flatMap((page) => page) ?? [];

  if (isLoadingArtist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Laden...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Artiest niet gevonden</div>
      </div>
    );
  }

  const canonicalUrl = artist.canonical_url || `https://www.musicscan.app/fanwall/${artist.slug}`;
  const pageTitle = artist.seo_title || `${artist.artist_name} FanWall | MusicScan`;
  const pageDescription = artist.seo_description || `Ontdek ${artist.photo_count} ${artist.artist_name} fan foto's: live concerten, vinyl collecties, en meer.`;
  const pageImage = artist.featured_photo_url || "https://www.musicscan.app/og-fanwall.jpg";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${artist.artist_name} FanWall`,
    description: pageDescription,
    url: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "MusicScan",
      url: "https://www.musicscan.app"
    },
    about: {
      "@type": "MusicGroup",
      name: artist.artist_name,
    },
    numberOfItems: artist.photo_count,
    image: pageImage,
    mainEntity: {
      "@type": "ImageGallery",
      name: `${artist.artist_name} Fan Photos`,
      numberOfItems: artist.photo_count,
      about: {
        "@type": "MusicGroup",
        name: artist.artist_name
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${artist.artist_name}, fan foto's, concert foto's, vinyl collectie, live muziek, muziek herinneringen, ${artist.artist_name} fans`} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:site_name" content="MusicScan" />
        <meta property="og:locale" content="nl_NL" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@musicscan_app" />
        <meta name="twitter:creator" content="@musicscan_app" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div
          className="relative h-64 md:h-80 bg-cover bg-center"
          style={{
            backgroundImage: artist.featured_photo_url
              ? `url(${artist.featured_photo_url})`
              : "none",
            backgroundColor: artist.featured_photo_url ? undefined : "hsl(var(--muted))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/fanwall")}
              className="absolute top-4 left-4 gap-2 text-white hover:text-white/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Alle Artiesten
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {artist.artist_name}
            </h1>
            <div className="flex items-center gap-6 text-white/90">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {artist.photo_count} foto's
              </span>
              {artist.total_views > 0 && (
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {artist.total_views.toLocaleString()} views
                </span>
              )}
              {artist.total_likes > 0 && (
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {artist.total_likes.toLocaleString()} likes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Upload CTA */}
          <Card className="p-4 mb-8 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">
                  Heb je een {artist.artist_name} herinnering?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Deel jouw concert foto, vinyl of memorabilia
                </p>
              </div>
              <Button onClick={() => navigate("/upload")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </Card>

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Alle Foto's</h2>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Formats</SelectItem>
                <SelectItem value="concert">Concert</SelectItem>
                <SelectItem value="vinyl">Vinyl</SelectItem>
                <SelectItem value="cd">CD</SelectItem>
                <SelectItem value="cassette">Cassette</SelectItem>
                <SelectItem value="poster">Poster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Grid */}
          {isLoadingPhotos ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="group overflow-hidden hover:shadow-lg transition-all">
                  <Link to={`/photo/${photo.seo_slug}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.display_url}
                        alt={photo.seo_title || artist.artist_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </Link>
                  <div className="p-3">
                    {photo.profiles && (
                      <Link
                        to={`/profile/${photo.profiles.user_id}`}
                        className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={photo.profiles.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {photo.profiles.first_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{photo.profiles.first_name}</span>
                      </Link>
                    )}

                    <Link to={`/photo/${photo.seo_slug}`}>
                      {photo.year && <p className="text-xs text-muted-foreground mb-1">{photo.year}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {photo.view_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {photo.view_count}
                          </span>
                        )}
                        <span>❤️ {photo.like_count}</span>
                        <span>💬 {photo.comment_count}</span>
                      </div>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nog geen foto's voor dit format
              </p>
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-8 text-center">
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}