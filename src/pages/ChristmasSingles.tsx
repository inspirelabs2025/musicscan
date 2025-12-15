import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Music, ArrowLeft, Globe, Star, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Footer } from '@/components/Footer';

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

export default function ChristmasSinglesPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: singles, isLoading } = useQuery({
    queryKey: ['christmas-singles-all'],
    queryFn: async () => {
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

      const storyIds = queueData?.map(q => q.music_story_id).filter(Boolean) || [];
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('music_stories')
        .select('id, slug, artwork_url, single_name')
        .in('id', storyIds);

      if (storiesError) throw storiesError;

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

  const sortedSingles = [...filteredSingles].sort((a, b) => {
    if (a.artwork_url && !b.artwork_url) return -1;
    if (!a.artwork_url && b.artwork_url) return 1;
    return 0;
  });

  return (
    <>
      <Helmet>
        <title>🎄 Kerst Singles | MusicScan</title>
        <meta name="description" content="Ontdek alle kerst singles: van klassiekers zoals Mariah Carey en Wham! tot moderne hits. Internationale en Nederlandse kerstmuziek." />
        <meta property="og:title" content="🎄 Kerst Singles | MusicScan" />
        <meta property="og:description" content="Ontdek alle kerst singles: klassiekers en moderne hits." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-red-950/5 to-green-950/5">
        {/* Hero Section */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-green-900/10 to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/kerst">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Kerst
              </Button>
            </Link>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">🎄</span>
                <Badge className="bg-gradient-to-r from-red-600 to-green-600 text-white border-0">
                  <Music className="h-3 w-3 mr-1" /> {singles?.length || 0} Singles
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                Kerst Singles Collectie
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6">
                Van klassiekers zoals Mariah Carey's "All I Want for Christmas Is You" tot moderne hits. 
                Ontdek de verhalen achter de mooiste kerstliedjes.
              </p>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="border-green-500/50 text-green-500">
                  <Globe className="h-3 w-3 mr-1" />
                  Internationaal
                </Badge>
                <Badge variant="outline" className="border-red-500/50 text-red-500">
                  <Star className="h-3 w-3 mr-1" />
                  Klassiekers & Modern
                </Badge>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                  <Gift className="h-3 w-3 mr-1" />
                  Nederlandse Kerst
                </Badge>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filter & Grid */}
        <section className="container mx-auto px-4 pb-20">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-8">
            <TabsList className="bg-card/80 backdrop-blur-sm">
              <TabsTrigger value="all">Alle ({singles?.length || 0})</TabsTrigger>
              <TabsTrigger value="classics">Klassiekers</TabsTrigger>
              <TabsTrigger value="modern">Modern</TabsTrigger>
              <TabsTrigger value="dutch">Nederlands</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredSingles.length} kerst singles gevonden
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sortedSingles.map((single, index) => (
                  <motion.div
                    key={single.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
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
            </>
          )}
        </section>

        <Footer />
      </div>
    </>
  );
}

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
    
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="absolute top-2 right-2 flex gap-1">
      <span className="text-lg">🎄</span>
      {single.is_classic && <span className="text-xs">⭐</span>}
    </div>
    
    {single.year && (
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
          {single.year}
        </Badge>
      </div>
    )}
    
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
