import { Link } from 'react-router-dom';
import { ArrowRight, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImageUrl, generateArtworkAlt } from '@/lib/image-utils';

export function PopularSinglesSection() {
  const { data: singles } = useQuery({
    queryKey: ['homepage-singles'],
    queryFn: async () => {
      const EXCLUDE_WORDS = [
        'greatest hits', 'best of', 'collection', 'compilation', 'sampler',
        'box set', 'complete', 'bbc recordings', 'up close', 'dvd',
        'anthology', 'remaster', 'deluxe edition', 'live at',
        'best', 'concert', 'interview', 'garage', 'live', 'e.p.k',
        'in concert', 'greatest', 'unplugged', 'sessions', 'demo',
      ];
      const { data } = await supabase
        .from('music_stories')
        .select('id,slug,title,artist,single_name,artwork_url,created_at')
        .eq('is_published', true)
        .not('single_name', 'is', null)
        .not('artwork_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60);
      const filtered = (data || []).filter((s) => {
        const name = (s.single_name || '').toLowerCase().trim();
        const title = (s.title || '').toLowerCase().trim();
        const combined = `${name} ${title}`;
        return (
          s.artwork_url &&
          name.length > 0 &&
          name.length <= 60 &&
          name !== 'none' &&
          title !== 'none' &&
          !!s.title &&
          !EXCLUDE_WORDS.some((w) => combined.includes(w))
        );
      });
      return filtered.slice(0, 8);
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!singles?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Populaire Singles</h2>
          <Link to="/verhalen?tab=singles" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors min-h-[44px] min-w-[44px] justify-end">
            Alle singles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {singles.map((single, i) => (
            <Link
              key={single.id}
              to={`/singles/${single.slug}`}
              className="flex-shrink-0 w-[150px] md:w-[180px] group snap-start"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-card mb-2 shadow-md relative border border-border">
                {single.artwork_url ? (
                  <img
                    src={optimizeImageUrl(single.artwork_url!, { width: 192, height: 192 })}
                    alt={generateArtworkAlt(single.artist, single.single_name || single.title, 'single cover')}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    decoding="async"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const fallback = img.parentElement?.querySelector('[data-fallback]') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  data-fallback
                  className="absolute inset-0 items-center justify-center bg-card"
                  style={{ display: single.artwork_url ? 'none' : 'flex' }}
                >
                  <Music className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-foreground truncate">{single.single_name || single.title}</h3>
              <p className="text-[11px] md:text-xs text-muted-foreground truncate">{single.artist}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
