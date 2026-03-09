import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImageUrl, generateArtworkAlt } from '@/lib/image-utils';

export function StoriesSection() {
  const { data: stories } = useQuery({
    queryKey: ['homepage-stories'],
    queryFn: async () => {
      const items: Array<{
        id: string;
        slug: string;
        title: string;
        artist: string;
        image_url: string | null;
        type: 'album' | 'anecdote';
      }> = [];

      const { data: albums } = await supabase
        .from('blog_posts')
        .select('id,slug,yaml_frontmatter,album_cover_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8);

      albums?.forEach(a => {
        const fm = a.yaml_frontmatter as any;
        const title = fm?.title;
        if (!title || title === 'Album Verhaal' || title.trim() === '') return;
        items.push({
          id: a.id,
          slug: a.slug,
          title,
          artist: fm?.artist || '',
          image_url: a.album_cover_url,
          type: 'album',
        });
      });

      const { data: anecdotes } = await supabase
        .from('music_anecdotes')
        .select('id,slug,anecdote_title,subject_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      anecdotes?.forEach(a => {
        items.push({
          id: a.id,
          slug: a.slug || a.id,
          title: a.anecdote_title,
          artist: a.subject_name || '',
          image_url: null,
          type: 'anecdote',
        });
      });

      return items.slice(0, 4);
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!stories?.length) return null;

  return (
    <section className="py-8 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-foreground">Album Verhalen & Anekdotes</h2>
          <Link to="/verhalen" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors min-h-[44px] min-w-[44px] justify-end whitespace-nowrap">
            Alle verhalen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={story.type === 'album' ? `/muziek-verhaal/${story.slug}` : `/anekdotes/${story.slug}`}
              className="group flex sm:flex-col gap-3 sm:gap-0 min-h-[44px]"
            >
              <div className="w-24 h-24 sm:w-full sm:aspect-[4/3] rounded-xl overflow-hidden bg-muted sm:mb-3 shadow-md flex-shrink-0">
                {story.image_url ? (
                  <img
                    src={optimizeImageUrl(story.image_url!, { width: 400, height: 300 })}
                    alt={generateArtworkAlt(story.artist, story.title, 'album cover')}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-4xl opacity-50">{story.type === 'album' ? '🎵' : '📖'}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center sm:justify-start min-w-0">
                <Badge variant="secondary" className="mb-1 text-[10px] w-fit">
                  {story.type === 'album' ? 'Album Verhaal' : 'Anekdote'}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2">{story.title}</h3>
                <p className="text-xs text-muted-foreground">{story.artist}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
