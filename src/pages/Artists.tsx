import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Search, Filter } from 'lucide-react';
import { useArtistStories, useArtistStoriesStats } from '@/hooks/useArtistStories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

const Artists = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params (convert genre to lowercase for matching)
  const urlGenre = searchParams.get('genre');
  const initialGenre = urlGenre ? urlGenre.toLowerCase() : 'all';
  const initialSearch = searchParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('newest');
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGenre && selectedGenre !== 'all') {
      params.set('genre', selectedGenre);
    }
    if (search) {
      params.set('search', search);
    }
    setSearchParams(params, { replace: true });
  }, [selectedGenre, search, setSearchParams]);

  const { data: stories, isLoading, error } = useArtistStories({
    search,
    genre: selectedGenre === 'all' ? undefined : selectedGenre,
    sortBy
  });

  const { data: stats, error: statsError } = useArtistStoriesStats();

  if (error || statsError) {
    console.error('Error loading artist stories:', error || statsError);
  }

  const handleStoryClick = (slug: string) => {
    navigate(`/artists/${slug}`);
  };

  return (
    <>
      <Helmet>
        <title>{selectedGenre !== 'all' ? `${selectedGenre} Artiesten` : 'Artiesten'} | Verhalen over Muziek Iconen | MusicScan</title>
        <meta 
          name="description" 
          content={selectedGenre !== 'all' 
            ? `Ontdek ${selectedGenre} artiesten en hun verhalen. Van biografie tot culturele impact.`
            : "Ontdek verhalen over iconische muziekartiesten uit verschillende genres en tijdperken. Van biografie tot culturele impact."
          } 
        />
        <meta property="og:title" content={`${selectedGenre !== 'all' ? selectedGenre + ' ' : ''}Artiesten | MusicScan`} />
        <meta 
          property="og:description" 
          content="Ontdek verhalen over iconische muziekartiesten uit verschillende genres en tijdperken." 
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.musicscan.app/artists" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Artiest Collectie</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Verhalen over Muziek Iconen
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ontdek de verhalen achter de grootste artiesten uit de muziekgeschiedenis. Van hun beginjaren tot hun blijvende erfenis.
              </p>

              {stats && (
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{stats.totalStories}</span>
                    <span className="ml-2">Artiesten</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-foreground">{stats.genres.length}</span>
                    <span className="ml-2">Genres</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Zoek artiest..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Genre Filter */}
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Alle Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Genres</SelectItem>
                    {stats?.genres.map(genre => (
                      <SelectItem key={genre} value={genre}>
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Sorteer op" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nieuwste</SelectItem>
                    <SelectItem value="popular">Populairste</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Artists Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {error || statsError ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto mb-4 text-red-500/20" />
                  <h3 className="text-xl font-semibold mb-2">Er is een fout opgetreden</h3>
                  <p className="text-muted-foreground mb-4">
                    We konden de artiesten niet laden. Probeer de pagina opnieuw te laden.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Opnieuw laden
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="w-full h-48 mb-4" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : stories && stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <Card
                      key={story.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50"
                      onClick={() => handleStoryClick(story.slug)}
                    >
                      <CardContent className="p-0">
                        {/* Artist Image */}
                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative">
                          {story.artwork_url ? (
                            <img
                              src={story.artwork_url}
                              alt={story.artist_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-20 h-20 text-muted-foreground/20" />
                            </div>
                          )}
                          
                          {/* Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-purple-500/90 text-white border-0">
                              <Music className="w-3 h-3 mr-1" />
                              ARTIEST
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {story.artist_name}
                          </h3>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {story.biography || story.story_content.substring(0, 150)}...
                          </p>

                          {/* Genres */}
                          {story.music_style && story.music_style.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {story.music_style.slice(0, 3).map((genre) => (
                                <Badge key={genre} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{story.views_count} weergaven</span>
                            {story.reading_time && (
                              <span>{story.reading_time} min lezen</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                  <h3 className="text-xl font-semibold mb-2">Geen artiesten gevonden</h3>
                  <p className="text-muted-foreground">
                    Probeer je zoekopdracht aan te passen of een ander filter te kiezen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Artists;
