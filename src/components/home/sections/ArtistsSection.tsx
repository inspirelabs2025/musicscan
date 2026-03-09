import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Artiesten</h2>
          <Link to="/artists" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors min-h-[44px] min-w-[44px] justify-end">
            Alle artiesten <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              to={artist.is_spotlight ? `/artist-spotlight/${artist.slug}` : `/artists/${artist.slug}`}
              className="flex-shrink-0 group snap-start"
            >
              <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-lg overflow-hidden bg-card shadow-md border border-border">
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
                  <div className="w-full h-full flex items-center justify-center bg-card">
                    <User className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-foreground truncate mt-2 text-center w-[120px] md:w-[160px]">{artist.artist_name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
