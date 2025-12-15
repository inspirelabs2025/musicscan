import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Music, ArrowRight, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';

interface ChristmasSingle {
  id: string;
  title: string;
  artist: string;
  artwork_url: string | null;
  slug: string;
  single_name: string | null;
  year?: number;
  country_origin?: string;
  is_dutch?: boolean;
  is_classic?: boolean;
}

type FilterType = 'all' | 'classics' | 'modern' | 'dutch';

export const ChristmasSingles = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: singles, isLoading } = useQuery({
    queryKey: ['christmas-singles-all'],
    queryFn: async () => {
      // Fetch from christmas_import_queue joined with music_stories for complete data
      const { data: queueData, error: queueError } = await supabase
        .from('christmas_import_queue')
        .select(`
          id,
          artist,
          song_title,
          year,
          is_dutch,
          is_classic,
          country_origin,
          music_story_id
        `)
        .eq('status', 'completed')
        .not('music_story_id', 'is', null);

      if (queueError) throw queueError;

      // Fetch music stories for artwork and slugs
      const storyIds = queueData?.map(q => q.music_story_id).filter(Boolean) || [];
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('music_stories')
        .select('id, slug, artwork_url, single_name')
        .in('id', storyIds);

      if (storiesError) throw storiesError;

      // Merge data
      const storiesMap = new Map(storiesData?.map(s => [s.id, s]) || []);
      
      return queueData?.map(q => {
        const story = storiesMap.get(q.music_story_id);
        return {
          id: q.id,
          title: q.song_title,
          artist: q.artist,
          artwork_url: story?.artwork_url || null,
          slug: story?.slug || '',
          single_name: story?.single_name || q.song_title,
          year: q.year,
          is_dutch: q.is_dutch,
          is_classic: q.is_classic,
          country_origin: q.country_origin,
        };
      }) || [];
    },
  });

  const filteredSingles = singles?.filter(single => {
    switch (filter) {
      case 'classics':
        return single.is_classic || (single.year && single.year < 2000);
      case 'modern':
        return !single.is_classic && single.year && single.year >= 2000;
      case 'dutch':
        return single.is_dutch || single.country_origin === 'NL' || single.country_origin === 'Netherlands';
      default:
        return true;
    }
  }) || [];

  // Shuffle and prioritize items with artwork
  const randomSingles = useMemo(() => {
    if (!filteredSingles || filteredSingles.length === 0) return [];
    
    // Separate items with and without artwork
    const withArtwork = filteredSingles.filter(s => s.artwork_url);
    const withoutArtwork = filteredSingles.filter(s => !s.artwork_url);
    
    // Shuffle both arrays
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Return shuffled items with artwork first, then without
    return [...shuffleArray(withArtwork), ...shuffleArray(withoutArtwork)];
  }, [filteredSingles]);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6 text-red-500" />
            Kerst Singles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-red-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6 text-green-500" />
              <span className="bg-gradient-to-r from-green-500 to-red-500 bg-clip-text text-transparent">
                Kerst Singles Collectie
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {singles?.length || 0} kerst singles uit alle tijden
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/50 text-green-500">
              <Globe className="h-3 w-3 mr-1" />
              Internationaal
            </Badge>
            <Badge variant="outline" className="border-red-500/50 text-red-500">
              <Star className="h-3 w-3 mr-1" />
              {filteredSingles.length} items
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mt-4">
          <TabsList className="bg-background/50">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="classics">Klassiekers</TabsTrigger>
            <TabsTrigger value="modern">Modern</TabsTrigger>
            <TabsTrigger value="dutch">Nederlands</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {randomSingles.slice(0, 24).map((single, index) => (
            <motion.div
              key={single.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {single.slug ? (
                <Link to={`/singles/${single.slug}`}>
                  <SingleCard single={single} />
                </Link>
              ) : (
                <SingleCard single={single} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Show more link */}
        {filteredSingles.length > 24 && (
          <div className="mt-6 text-center">
            <Link to="/singles?tag=christmas">
              <Button variant="outline" className="group">
                Bekijk alle {filteredSingles.length} kerst singles
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SingleCard = ({ single }: { single: ChristmasSingle }) => (
  <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
    {single.artwork_url ? (
      <img
        src={single.artwork_url}
        alt={`${single.artist} - ${single.title}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-green-900/50">
        <Music className="h-12 w-12 text-muted-foreground/50" />
      </div>
    )}
    
    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Christmas badge */}
    <div className="absolute top-2 right-2 flex gap-1">
      <span className="text-lg">🎄</span>
      {single.is_classic && <span className="text-xs">⭐</span>}
    </div>
    
    {/* Year badge */}
    {single.year && (
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
          {single.year}
        </Badge>
      </div>
    )}
    
    {/* Info overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
      <p className="text-white font-medium text-sm truncate">
        {single.single_name || single.title}
      </p>
      <p className="text-white/70 text-xs truncate">
        {single.artist}
      </p>
    </div>
  </div>
);
