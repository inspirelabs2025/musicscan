import { Link } from 'react-router-dom';
import { ArrowRight, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Populaire Singles</h2>
          <Link to="/verhalen?tab=singles" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            Alle singles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {singles.map((single, i) => (
              <Link
                key={single.id}
                to={`/singles/${single.slug}`}
                className="flex-shrink-0 w-40 md:w-48 group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2 shadow-md">
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
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-muted ${single.artwork_url ? 'hidden' : ''}`}>
                    <Music className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{single.single_name || single.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{single.artist}</p>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
