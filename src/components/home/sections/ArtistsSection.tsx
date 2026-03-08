import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
    <section className="py-14 bg-muted/30 section-artists min-h-[600px] md:min-h-[350px]" style={{ contain: 'layout' as any }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Artiesten</h2>
          <Link to="/artists" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            Alle artiesten <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {artists.map((artist, i) => (
              <Link
                key={artist.id}
                to={artist.is_spotlight ? `/artist-spotlight/${artist.slug}` : `/artists/${artist.slug}`}
                className={`flex-shrink-0 group ${i === 0 ? 'w-56 md:w-64' : 'w-40 md:w-48'}`}
              >
                <div className={`rounded-xl overflow-hidden bg-muted mb-2 ${i === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}>
                  <img
                    src={optimizeImageUrl(artist.artwork_url!, { width: i === 0 ? 256 : 192, height: i === 0 ? 340 : 192 })}
                    alt={generateArtworkAlt(artist.artist_name, '', 'artist photo')}
                    loading="lazy"
                    decoding="async"
                    width={i === 0 ? 256 : 192}
                    height={i === 0 ? 340 : 192}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className={`font-semibold text-foreground truncate ${i === 0 ? 'text-base' : 'text-sm'}`}>
                  {artist.artist_name}
                </h3>
                {i === 0 && artist.spotlight_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{artist.spotlight_description}</p>
                )}
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
