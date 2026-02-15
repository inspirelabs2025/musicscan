import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Search, Filter, ChevronDown } from 'lucide-react';
import { useArtistStories, useArtistStoriesStats } from '@/hooks/useArtistStories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

const Artists = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tr } = useLanguage();
  const a = tr.artists;
  
  const urlGenre = searchParams.get('genre');
  const urlCountry = searchParams.get('country');
  const initialGenre = urlGenre ? urlGenre.toLowerCase() : 'all';
  const initialCountry = urlCountry || '';
  const initialSearch = searchParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('newest');
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGenre && selectedGenre !== 'all') params.set('genre', selectedGenre);
    if (selectedCountry) params.set('country', selectedCountry);
    if (search) params.set('search', search);
    setSearchParams(params, { replace: true });
  }, [selectedGenre, selectedCountry, search, setSearchParams]);

  const { data: stories, isLoading, error } = useArtistStories({
    search,
    genre: selectedGenre === 'all' ? undefined : selectedGenre,
    country: selectedCountry || undefined,
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
        <title>{selectedGenre !== 'all' ? `${selectedGenre} ${a.artist}` : tr.nav.artists} | {a.title} | MusicScan</title>
        <meta 
          name="description" 
          content={selectedGenre !== 'all' 
            ? `${a.defaultDesc}`
            : a.defaultDesc
          } 
        />
        <meta property="og:title" content={`${selectedGenre !== 'all' ? selectedGenre + ' ' : ''}${tr.nav.artists} | MusicScan`} />
        <meta property="og:description" content={a.defaultDesc} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.musicscan.app/artists" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-b from-primary/10 to-background py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Music className="w-7 h-7 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold">
                  {selectedCountry === 'nederland' ? a.dutchIcons : 
                   selectedCountry === 'frankrijk' ? a.frenchIcons : a.title}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                {selectedCountry === 'nederland' ? a.dutchDesc
                  : selectedCountry === 'frankrijk' ? a.frenchDesc
                  : a.defaultDesc}
              </p>

              {(selectedCountry === 'nederland' || selectedCountry === 'frankrijk') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCountry('')}
                >
                  ✕ {selectedCountry === 'nederland' ? tr.nav.netherlands : tr.nav.france} {a.removeFilter}
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center mb-2">
                  <Filter className="w-4 h-4" />
                  <span>{a.searchFilter}</span>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col md:flex-row gap-4 pt-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={a.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={a.allGenres} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{a.allGenres}</SelectItem>
                        {stats?.genres.map(genre => (
                          <SelectItem key={genre} value={genre}>
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder={a.sortBy} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{a.newest}</SelectItem>
                        <SelectItem value="popular">{a.mostPopular}</SelectItem>
                        <SelectItem value="alphabetical">{a.az}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {error || statsError ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto mb-4 text-red-500/20" />
                  <h3 className="text-xl font-semibold mb-2">{a.errorOccurred}</h3>
                  <p className="text-muted-foreground mb-4">{a.couldNotLoad}</p>
                  <Button onClick={() => window.location.reload()}>
                    {tr.common.reloadPage}
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
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-purple-500/90 text-white border-0">
                              <Music className="w-3 h-3 mr-1" />
                              {a.artist}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {story.artist_name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {story.biography || (story.story_content ? story.story_content.substring(0, 150) + '...' : a.discoverStory)}
                          </p>
                          {story.music_style && story.music_style.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {story.music_style.slice(0, 3).map((genre) => (
                                <Badge key={genre} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{story.views_count} {tr.common.views}</span>
                            {story.reading_time && (
                              <span>{story.reading_time} {a.minRead}</span>
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
                  <h3 className="text-xl font-semibold mb-2">{a.noArtistsFound}</h3>
                  <p className="text-muted-foreground">{a.adjustSearch}</p>
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
