import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Loader2, Clock, Eye, ArrowLeft, ShoppingBag } from "lucide-react";
import { useArtistSpotlight } from "@/hooks/useArtistSpotlight";
import { useArtistProducts } from "@/hooks/useArtistProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import { MusicGroupStructuredData } from "@/components/SEO/MusicGroupStructuredData";
import { ImageGallery } from "@/components/spotlight/ImageGallery";

const ArtistSpotlight = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: spotlight, isLoading, error } = useArtistSpotlight(slug!);
  const { data: products } = useArtistProducts(spotlight?.artist_name || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !spotlight) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2">Spotlight niet gevonden</h2>
            <p className="text-muted-foreground mb-4">
              Deze spotlight bestaat niet of is nog niet gepubliceerd.
            </p>
            <Button asChild>
              <Link to="/artist-spotlights">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar overzicht
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canonicalUrl = `https://www.musicscan.app/artist-spotlight/${spotlight.slug}`;
  
  // Hero image: artwork_url of eerste spotlight_image als fallback
  const heroImage = spotlight.artwork_url || (spotlight.spotlight_images as any[])?.[0]?.url;

  const normalizeUrl = (url?: string | null) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return url;
    }
  };

  // Verwijder alleen *opeenvolgende* dubbele afbeeldingen in de tekst (exact hetzelfde plaatje onder elkaar)
  const dedupeConsecutiveMarkdownImages = (markdown: string) => {
    const lines = markdown.split("\n");
    const out: string[] = [];
    let lastImageKey = "";

    for (const line of lines) {
      const match = line.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
      if (match?.[1]) {
        const key = normalizeUrl(match[1]);
        if (key && key === lastImageKey) {
          continue; // skip duplicaat direct onder elkaar
        }
        lastImageKey = key;
      } else {
        lastImageKey = "";
      }
      out.push(line);
    }

    return out.join("\n");
  };

  const storyContent = dedupeConsecutiveMarkdownImages(spotlight.story_content);

  return (
    <>
      <Helmet>
        <title>{spotlight.meta_title || `${spotlight.artist_name} - In de Spotlight | MusicScan`}</title>
        <meta name="description" content={spotlight.meta_description || spotlight.spotlight_description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={spotlight.artist_name} />
        <meta property="og:description" content={spotlight.spotlight_description || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {heroImage && <meta property="og:image" content={heroImage} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={spotlight.artist_name} />
        <meta name="twitter:description" content={spotlight.spotlight_description || ""} />
        {heroImage && <meta name="twitter:image" content={heroImage} />}
      </Helmet>

      {spotlight.music_style && (
        <MusicGroupStructuredData
          name={spotlight.artist_name}
          description={spotlight.spotlight_description || spotlight.story_content.substring(0, 200)}
          image={heroImage}
          url={canonicalUrl}
          genre={spotlight.music_style}
          albums={spotlight.notable_albums}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="container mx-auto px-4">
            <Button asChild variant="ghost" className="mb-6">
              <Link to="/artist-spotlights">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar spotlights
              </Link>
            </Button>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content - Takes 2/3 width */}
              <div className="lg:col-span-2">
                {heroImage && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg mb-6 shadow-lg">
                    <img
                      src={heroImage}
                      alt={spotlight.artist_name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {spotlight.artist_name}
                </h1>
                
                {spotlight.spotlight_description && (
                  <p className="text-xl text-muted-foreground mb-6">
                    {spotlight.spotlight_description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{spotlight.reading_time} minuten lezen</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{spotlight.views_count} views</span>
                  </div>
                  <span>{spotlight.word_count} woorden</span>
                </div>

                {spotlight.music_style && spotlight.music_style.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {spotlight.music_style.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator className="mb-8" />

                {/* Image Gallery - toon geen dubbele set (dedupe op URL zonder query) */}
                {(() => {
                  const seen = new Set<string>();
                  if (heroImage) {
                    seen.add(heroImage);
                    seen.add(normalizeUrl(heroImage));
                  }

                  const galleryImages = (spotlight.spotlight_images as any[] || []).filter((img: any) => {
                    const url = img?.url;
                    if (!url || !url.startsWith("http") || url.length >= 1000) return false;

                    const normalized = normalizeUrl(url);
                    if (seen.has(url) || seen.has(normalized)) return false;

                    seen.add(url);
                    seen.add(normalized);
                    return true;
                  });

                  // Als er maar 1 afbeelding overblijft, is dit praktisch altijd de "dubbele set".
                  // Toon de gallery pas bij 2+ unieke afbeeldingen.
                  return galleryImages.length > 1 ? (
                    <div className="mb-8">
                      <ImageGallery images={galleryImages} artistName={spotlight.artist_name} />
                    </div>
                  ) : null;
                })()}

                {/* Story Content with Enhanced Typography */}
                <div className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-p:text-foreground
                  prose-strong:font-semibold prose-strong:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4
                  prose-li:text-foreground prose-li:my-2">
                  {(() => {
                    const markdownSeen = new Set<string>();

                    return (
                      <ReactMarkdown
                        components={{
                          img: ({ src, alt }) => {
                            const normalized = normalizeUrl(src);
                            const key = normalized || src || "";

                            if (!key) return null;
                            if (markdownSeen.has(key)) return null;

                            markdownSeen.add(key);

                            return (
                              <img
                                src={src || ""}
                                alt={alt || `Foto van ${spotlight.artist_name}`}
                                loading="lazy"
                                className="rounded-lg"
                              />
                            );
                          },
                        }}
                      >
                        {spotlight.story_content}
                      </ReactMarkdown>
                    );
                  })()}
                </div>
              </div>

              {/* Sidebar - Takes 1/3 width */}
              <div className="space-y-6">
                {/* Featured Products */}
                {products && products.length > 0 && (
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        {spotlight.artist_name} Producten
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {products.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            {product.primary_image && (
                              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={product.primary_image}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {product.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                €{product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {products.length > 3 && (
                        <Button asChild className="w-full" variant="outline">
                          <Link to={`/shop/products?artist=${encodeURIComponent(spotlight.artist_name)}`}>
                            Bekijk alle {products.length} producten
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Notable Albums */}
                {spotlight.notable_albums && spotlight.notable_albums.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Must-Have Albums</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {spotlight.notable_albums.map((album) => (
                          <li key={album} className="text-sm">
                            • {album}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Products Grid */}
        {products && products.length > 3 && (
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold mb-6">
              Shop {spotlight.artist_name} Collectie
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                    {product.primary_image && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.primary_image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-lg font-bold">
                        €{product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ArtistSpotlight;
