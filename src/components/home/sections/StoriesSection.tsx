import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

      // Album stories - fetch more to fill gaps
      const { data: albums } = await supabase
        .from('blog_posts')
        .select('id,slug,yaml_frontmatter,album_cover_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8);

      albums?.forEach(a => {
        const fm = a.yaml_frontmatter as any;
        const title = fm?.title;
        // Skip items without a real title
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

      // Anecdotes - use correct column names
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
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Album Verhalen & Anekdotes</h2>
          <Link to="/verhalen" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            Alle verhalen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={story.type === 'album' ? `/muziek-verhaal/${story.slug}` : `/anekdotes/${story.slug}`}
              className="group"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-3">
                {story.image_url ? (
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl opacity-50">{story.type === 'album' ? '🎵' : '📖'}</span>
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="mb-1.5 text-[10px]">
                {story.type === 'album' ? 'Album Verhaal' : 'Anekdote'}
              </Badge>
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">{story.title}</h3>
              <p className="text-xs text-muted-foreground">{story.artist}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
