import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
    <section className="py-10 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Album Verhalen & Anekdotes</h2>
          <Link to="/verhalen" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors min-h-[44px] min-w-[44px] justify-end whitespace-nowrap">
            Alle verhalen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={story.type === 'album' ? `/muziek-verhaal/${story.slug}` : `/anekdotes/${story.slug}`}
              className="group rounded-xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-shadow min-h-[44px]"
            >
              <div className="w-full aspect-[4/3] bg-muted">
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
                    <span className="text-4xl opacity-50">{story.type === 'album' ? '🎵' : '📖'}</span>
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4">
                <span className="inline-block mb-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                  {story.type === 'album' ? 'Album Verhaal' : 'Anekdote'}
                </span>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2">{story.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{story.artist}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
