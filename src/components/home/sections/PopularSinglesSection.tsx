import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function PopularSinglesSection() {
  const { data: singles } = useQuery({
    queryKey: ['homepage-singles'],
    queryFn: async () => {
      const EXCLUDE_WORDS = [
        'greatest hits', 'best of', 'collection', 'compilation', 'sampler',
        'box set', 'complete', 'bbc recordings', 'up close', 'dvd',
        'anthology', 'remaster', 'deluxe edition', 'live at',
      ];
      const { data } = await supabase
        .from('music_stories')
        .select('id,slug,title,artist,single_name,artwork_url,created_at')
        .eq('is_published', true)
        .not('single_name', 'is', null)
        .not('artwork_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(40);
      const filtered = (data || []).filter((s) => {
        const name = (s.single_name || '').toLowerCase();
        const title = (s.title || '').toLowerCase();
        const combined = `${name} ${title}`;
        return (
          s.artwork_url &&
          !EXCLUDE_WORDS.some((w) => combined.includes(w))
        );
      });
      return filtered.slice(0, 8);
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!singles?.length) return null;

  return (
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Populaire Singles</h2>
          <Link to="/verhalen?tab=singles" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            Alle singles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {singles.map((single) => (
              <Link
                key={single.id}
                to={`/singles/${single.slug}`}
                className="flex-shrink-0 w-40 md:w-48 group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <img
                    src={single.artwork_url!}
                    alt={single.single_name || single.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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
