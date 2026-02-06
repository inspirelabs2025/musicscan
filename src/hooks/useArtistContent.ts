import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  image_url?: string | null;
}

interface ArtistContentResult {
  artistStory: ContentItem | null;
  albumStories: ContentItem[];
  singles: ContentItem[];
  anecdotes: ContentItem[];
  news: ContentItem[];
  products: ContentItem[];
  totalCount: number;
  isLoading: boolean;
}

export function useArtistContent(artistName: string | null): ArtistContentResult {
  const [data, setData] = useState<Omit<ArtistContentResult, 'isLoading'>>({
    artistStory: null,
    albumStories: [],
    singles: [],
    anecdotes: [],
    news: [],
    products: [],
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!artistName) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const name = artistName.trim();

        const [
          artistStoryRes,
          albumStoriesRes,
          singlesRes,
          anecdotesRes,
          newsRes,
          productsRes,
        ] = await Promise.all([
          // Artist story
          supabase
            .from('artist_stories')
            .select('id, artist_name, slug, artwork_url')
            .ilike('artist_name', name)
            .eq('is_published', true)
            .limit(1)
            .maybeSingle(),

          // Album stories from blog_posts
          supabase
            .from('blog_posts')
            .select('id, slug, album_cover_url, yaml_frontmatter')
            .eq('is_published', true)
            .neq('album_type', 'single')
            .ilike('yaml_frontmatter->>artist', name)
            .order('created_at', { ascending: false })
            .limit(5),

          // Singles from music_stories (where single_name IS NOT NULL)
          supabase
            .from('music_stories')
            .select('id, title, slug, artwork_url, single_name')
            .ilike('artist', name)
            .not('single_name', 'is', null)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(5),

          // Anecdotes
          supabase
            .from('music_anecdotes')
            .select('id, anecdote_title, slug')
            .ilike('subject_name', name)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(5),

          // News
          supabase
            .from('news_blog_posts')
            .select('id, title, slug, image_url')
            .ilike('title', `%${name}%`)
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(5),

          // Products
          supabase
            .from('platform_products')
            .select('id, title, slug, image_url, price')
            .ilike('artist', name)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(6),
        ]);

        const artistStory = artistStoryRes.data
          ? { id: artistStoryRes.data.id, title: artistStoryRes.data.artist_name, slug: artistStoryRes.data.slug, image_url: artistStoryRes.data.artwork_url }
          : null;

        const albumStories = (albumStoriesRes.data || []).map(s => ({
          id: s.id,
          title: (s.yaml_frontmatter as any)?.title || 'Album',
          slug: s.slug,
          image_url: s.album_cover_url,
        }));

        const singles = (singlesRes.data || []).map(s => ({
          id: s.id, title: s.single_name || s.title, slug: s.slug, image_url: s.artwork_url,
        }));

        const anecdotes = (anecdotesRes.data || []).map(a => ({
          id: a.id, title: a.anecdote_title, slug: a.slug,
        }));

        const news = (newsRes.data || []).map(n => ({
          id: n.id, title: n.title, slug: n.slug, image_url: n.image_url,
        }));

        const products = (productsRes.data || []).map(p => ({
          id: p.id, title: p.title, slug: p.slug, image_url: p.image_url,
        }));

        const totalCount =
          (artistStory ? 1 : 0) +
          albumStories.length +
          singles.length +
          anecdotes.length +
          news.length +
          products.length;

        setData({ artistStory, albumStories, singles, anecdotes, news, products, totalCount });
      } catch (err) {
        console.error('Error fetching artist content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [artistName]);

  return { ...data, isLoading };
}
