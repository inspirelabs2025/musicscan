import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Loader2, Clock, Eye, Sparkles } from "lucide-react";
import { useArtistSpotlights } from "@/hooks/useArtistSpotlight";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ArtistSpotlights = () => {
  const { data: spotlights, isLoading } = useArtistSpotlights({ published: true, spotlightOnly: true });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpotlights = spotlights?.filter(story =>
    story.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.spotlight_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredSpotlight = filteredSpotlights?.[0];
  const remainingSpotlights = filteredSpotlights?.slice(1);

  return (
    <>
      <Helmet>
        <title>Artiest Spotlights - In de Schijnwerpers | MusicScan</title>
        <meta 
          name="description" 
          content="Ontdek uitgebreide verhalen over iconische artiesten. Van biografieën tot muzikale evolutie en culturele impact." 
        />
        <link rel="canonical" href="https://www.musicscan.app/artist-spotlights" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Artiest Spotlights
                </h1>
              </div>
              <p className="text-xl text-muted-foreground mb-6">
                Duik in het leven, de muziek en de impact van legendes
              </p>
              <Input
                type="search"
                placeholder="Zoek een artiest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md mx-auto"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !filteredSpotlights || filteredSpotlights.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">
                  {searchQuery ? "Geen resultaten gevonden" : "Nog geen spotlights beschikbaar"}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Probeer een andere zoekopdracht"
                    : "Binnenkort vind je hier uitgebreide verhalen over iconische artiesten"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Featured Spotlight */}
              {featuredSpotlight && (
                <Card className="overflow-hidden border-2 border-primary/20">
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredSpotlight.artwork_url && (
                      <div className="aspect-square md:aspect-auto overflow-hidden">
                        <img
                          src={featuredSpotlight.artwork_url}
                          alt={featuredSpotlight.artist_name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-center">
                      <Badge className="w-fit mb-4" variant="default">
                        🌟 Featured Spotlight
                      </Badge>
                      <CardTitle className="text-3xl mb-4">
                        {featuredSpotlight.artist_name}
                      </CardTitle>
                      <CardDescription className="text-base mb-6">
                        {featuredSpotlight.spotlight_description}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{featuredSpotlight.reading_time} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{featuredSpotlight.views_count} views</span>
                        </div>
                      </div>
                      {featuredSpotlight.music_style && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {featuredSpotlight.music_style.slice(0, 3).map((genre) => (
                            <Badge key={genre} variant="secondary">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Link
                        to={`/artist-spotlight/${featuredSpotlight.slug}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit"
                      >
                        Lees het volledige verhaal
                      </Link>
                    </div>
                  </div>
                </Card>
              )}

              {/* Grid of Spotlights */}
              {remainingSpotlights && remainingSpotlights.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold">Meer Spotlights</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {remainingSpotlights.map((story) => (
                      <Link
                        key={story.id}
                        to={`/artist-spotlight/${story.slug}`}
                        className="group"
                      >
                        <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                          {story.artwork_url && (
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={story.artwork_url}
                                alt={story.artist_name}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="group-hover:text-primary transition-colors">
                              {story.artist_name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {story.spotlight_description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{story.reading_time} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{story.views_count} views</span>
                              </div>
                            </div>
                            {story.music_style && story.music_style.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {story.music_style.slice(0, 2).map((genre) => (
                                  <Badge key={genre} variant="secondary" className="text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArtistSpotlights;
