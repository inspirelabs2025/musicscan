import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Gift, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
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
    queryKey: ['christmas-songs-with-artwork'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select(`
          id,
          title,
          artist,
          artwork_url,
          slug,
          single_name
        `)
        .not('artwork_url', 'is', null)
        .or('title.ilike.%christmas%,title.ilike.%kerst%,title.ilike.%xmas%,single_name.ilike.%christmas%,single_name.ilike.%kerst%')
        .order('created_at', { ascending: false })
        .limit(12);

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
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-red-500" />
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Muziek Collectie
            </span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <Badge variant="outline" className="border-red-500/50 text-red-500">
            {songs.length} items
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ontdek de verhalen achter de mooiste kerstliedjes
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/singles/${song.slug}`}>
                <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
                  <img
                    src={song.artwork_url}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Christmas badge */}
                  <div className="absolute top-2 right-2">
                    <span className="text-lg">🎄</span>
                  </div>
                  
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-medium text-sm truncate">
                      {song.single_name || song.title.split(' - ')[1] || song.title}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {song.artist}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-border/50">
          <Link to="/singles?tag=kerst">
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
