import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChristmasSockProduct {
  id: string;
  slug: string;
  title: string;
  artist: string;
  price: number;
  image_url: string;
  view_count: number;
  is_featured: boolean;
}

export const ChristmasSocks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user!.id });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('regenerate-christmas-sock-designs', {
        body: { limit: 10 },
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['christmas-sock-products'] });
      if (data?.regenerated > 0) {
        toast({
          title: `${data.regenerated} kerst sokken bijgewerkt`,
          description: 'De sok-ontwerpen zijn succesvol opnieuw gegenereerd.',
        });
      }
    },
    onError: (error: any) => {
      console.error('Regenerate christmas socks error:', error);
      toast({
        title: 'Kerst sokken bijwerken mislukt',
        description: error?.message || 'Er ging iets mis tijdens het bijwerken van de sok-ontwerpen.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete and regenerate with artist portraits
  const regenerateWithArtists = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('regenerate-christmas-sock-designs', {
        body: { deleteExisting: true },
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['christmas-sock-products'] });
      toast({
        title: '🎄 Artiest sokken worden gegenereerd!',
        description: `${data?.deleted?.socks || 0} oude sokken verwijderd. Nieuwe artiest portretten worden nu aangemaakt.`,
      });
    },
    onError: (error: any) => {
      console.error('Regenerate artist socks error:', error);
      toast({
        title: 'Artiest sokken regenereren mislukt',
        description: error?.message || 'Er ging iets mis.',
        variant: 'destructive',
      });
    },
  });

  const { data: socks, isLoading } = useQuery({
    queryKey: ['christmas-sock-products'],
    queryFn: async () => {
      const { data: albumSocks, error: albumError } = await supabase
        .from('album_socks')
        .select('product_id, base_design_url')
        .eq('pattern_type', 'christmas')
        .not('product_id', 'is', null)
        .limit(50);

      if (albumError) throw albumError;

      const baseDesignByProductId = new Map<string, string>();
      for (const s of albumSocks || []) {
        if (s.product_id && s.base_design_url) baseDesignByProductId.set(s.product_id, s.base_design_url);
      }

      const productIds = (albumSocks || [])
        .map((s) => s.product_id)
        .filter((id): id is string => Boolean(id));

      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('platform_products')
        .select('id, slug, title, artist, price, view_count, is_featured, primary_image')
        .in('id', productIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const all: ChristmasSockProduct[] = [];
      for (const p of (data || []) as any[]) {
        const image_url = baseDesignByProductId.get(p.id) || p.primary_image || '';
        all.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          artist: p.artist,
          price: p.price,
          view_count: p.view_count,
          is_featured: p.is_featured,
          image_url,
        });
      }

      return all;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Shuffle socks randomly on each render
  const shuffledSocks = useMemo(() => {
    if (!socks || socks.length === 0) return [];
    const shuffled = [...socks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [socks]);

  const hasSocks = shuffledSocks.length > 0;

  useEffect(() => {
    if (!isAdmin) return;
    if (!hasSocks) return;

    const key = 'christmas_socks_regen_once';
    if (sessionStorage.getItem(key) === 'true') return;
    sessionStorage.setItem(key, 'true');
    regenerate.mutate();
  }, [isAdmin, hasSocks]);


  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🧦 Kerst Sokken Collectie</CardTitle>
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

  if (!hasSocks) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🧦</span>
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Sokken Collectie
            </span>
            <span className="text-xl">🎄</span>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">🎁 {shuffledSocks.length} ontwerpen</Badge>
          </div>
        </div>

        <p className="text-base text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">Feestelijke kerst sokken</span> — het perfecte cadeau voor
          muziekliefhebbers
        </p>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shuffledSocks.map((sock, index) => (
            <motion.div
              key={sock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/product/${sock.slug}`} className="group block">
                <Card className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-green-500">
                  <div className="relative aspect-square">
                      <div className="absolute inset-0 p-4">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-red-100/30 to-green-100/30 dark:from-red-950/20 dark:to-green-950/20 overflow-hidden">
                          {sock.image_url ? (
                            <img
                              src={sock.image_url}
                              alt={`${sock.artist} - ${sock.title} kerstsokken`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">🧦</span>
                            </div>
                          )}
                        </div>
                      </div>

                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className="bg-red-600 text-white font-bold">🎄 Kerst Editie</Badge>
                      {sock.is_featured && (
                        <Badge className="bg-vinyl-gold text-black font-bold">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Uitgelicht
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3">
                      <Badge variant="secondary" className="bg-black/60 text-white border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        {sock.view_count || 0}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Premium Merino</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-1">{sock.artist}</p>
                    <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-green-600 transition-colors">
                      {sock.title}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-lg font-bold text-primary">€{sock.price.toFixed(2)}</p>
                      <div className="flex items-center gap-1 text-sm text-green-600 group-hover:text-green-700">
                        <span>Bekijk</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

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
