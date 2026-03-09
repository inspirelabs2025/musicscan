import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { optimizeImageUrl, generateArtworkAlt } from '@/lib/image-utils';

export function ArtistsSection() {
  const { data: artists } = useQuery({
    queryKey: ['homepage-artists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('artist_stories')
        .select('id,slug,artist_name,artwork_url,spotlight_description,is_spotlight')
        .eq('is_published', true)
        .not('artwork_url', 'is', null)
        .order('views_count', { ascending: false })
        .limit(8);
      return (data || []).filter((a) => !!a.artwork_url);
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!artists?.length) return null;

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Artiesten</h2>
          <Link to="/artists" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            Alle artiesten <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={artist.is_spotlight ? `/artist-spotlight/${artist.slug}` : `/artists/${artist.slug}`}
                className="flex-shrink-0 w-40 md:w-48 group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2 shadow-md">
                  {artist.artwork_url ? (
                    <img
                      src={optimizeImageUrl(artist.artwork_url!, { width: 192, height: 192 })}
                      alt={generateArtworkAlt(artist.artist_name, '', 'artist photo')}
                      loading="lazy"
                      decoding="async"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{artist.artist_name}</h3>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
