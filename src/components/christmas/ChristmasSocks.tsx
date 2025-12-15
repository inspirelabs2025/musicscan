import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Sock {
  id: string;
  artist_name: string;
  album_title: string;
  slug: string;
  album_cover_url: string;
  mockup_url: string | null;
  product_id: string | null;
}

// Christmas-related artists and keywords
const CHRISTMAS_KEYWORDS = ['christmas', 'kerst', 'xmas', 'holiday', 'winter', 'snow', 'santa', 'jingle'];
const CHRISTMAS_ARTISTS = [
  'wham!', 'mariah carey', 'michael bublé', 'bing crosby', 'nat king cole',
  'frank sinatra', 'dean martin', 'andy williams', 'johnny mathis', 'brenda lee',
  'jose feliciano', 'the ronettes', 'band aid', 'chris rea', 'slade',
  'paul mccartney', 'john lennon', 'boney m', 'shakin\' stevens', 'wizzard',
  'the pogues', 'kirsty maccoll', 'elton john', 'bobby helms', 'gene autry',
  'eartha kitt', 'chuck berry', 'darlene love', 'jackson 5', 'kelly clarkson'
];

export const ChristmasSocks = () => {
  const { data: socks, isLoading } = useQuery({
    queryKey: ['christmas-socks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_socks')
        .select('id, artist_name, album_title, slug, album_cover_url, mockup_url, product_id')
        .eq('is_published', true)
        .eq('pattern_type', 'christmas')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data || []) as Sock[];
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧦 Kerst Sokken Collectie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!socks || socks.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🧦</span>
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Sokken Collectie
            </span>
            <span className="text-xl">🎄</span>
          </CardTitle>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
            🎁 {socks.length} designs
          </Badge>
        </div>
        <p className="text-base text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">Feestelijke kerst sokken</span> — het perfecte cadeau voor muziekliefhebbers
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {socks.map((sock, index) => (
            <motion.div
              key={sock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={sock.product_id ? `/product/${sock.slug}` : `/socks/${sock.slug}`}>
                <div className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                  {/* Image section */}
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={sock.mockup_url || sock.album_cover_url}
                      alt={`${sock.artist_name} kerst sokken`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="text-xl">🎄</span>
                    </div>
                  </div>
                  
                  {/* Content footer */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Kerst Sokken</span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {sock.artist_name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{sock.album_title}</p>
                    <p className="text-sm font-medium text-foreground">€24,95</p>
                    <div className="flex items-center gap-1 text-sm text-green-600 group-hover:text-green-700 pt-1">
                      <span>Bekijk product</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex justify-center pt-6 border-t border-border/50">
          <Link to="/socks">
            <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 group">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Bekijk alle muziek sokken
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
