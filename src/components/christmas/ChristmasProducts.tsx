import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Gift, ShoppingBag, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChristmasSong {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  slug: string;
  single_name: string | null;
}

export const ChristmasProducts = () => {
  const { data: songs, isLoading } = useQuery({
    queryKey: ['christmas-songs-by-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select(`
          id,
          title,
          artist,
          artwork_url,
          slug,
          single_name,
          tags
        `)
        .contains('tags', ['christmas'])
        .order('artwork_url', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as ChristmasSong[];
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-red-500" />
            Kerst Collectie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!songs || songs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-red-500" />
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Muziek Verhalen
            </span>
            <span className="text-xl">🎄</span>
          </CardTitle>
          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
            📖 {songs.length} verhalen
          </Badge>
        </div>
        <p className="text-base text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">Ontdek de fascinerende verhalen</span> achter de mooiste kerstklassiekers
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/singles/${song.slug}`}>
                <div className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                  {/* Image section */}
                  <div className="relative aspect-[4/3]">
                    <img
                      src={song.artwork_url}
                      alt={song.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="text-xl">🎄</span>
                    </div>
                  </div>
                  
                  {/* Content footer - card background */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Verhaal</span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {song.single_name || song.title.split(' - ')[1] || song.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                    <div className="flex items-center gap-1 text-sm text-red-600 group-hover:text-red-700 pt-1">
                      <span>Lees het verhaal</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-border/50">
          <Link to="/kerst-singles">
            <Button variant="outline" className="group border-red-500/50 hover:bg-red-500/10">
              <ShoppingBag className="h-4 w-4 mr-2 text-red-500" />
              Bekijk alle kerstverhalen
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/shop">
            <Button className="bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700">
              <Gift className="h-4 w-4 mr-2" />
              Shop Kerst Merchandise
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
