import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  id: string;
  type: 'album' | 'single' | 'artist' | 'release' | 'news' | 'youtube' | 'podcast' | 'review' | 'anecdote' | 'history' | 'fanwall' | 'product' | 'concert' | 'metal_print' | 'tshirt' | 'socks';
  title: string;
  subtitle?: string;
  image_url?: string;
  category_label: string;
  link: string;
  date: string;
  description?: string;
}

const CATEGORY_LABELS: Record<NewsItem['type'], string> = {
  album: 'ALBUM VERHAAL',
  single: 'SINGLE',
  artist: 'ARTIEST',
  release: 'NIEUWE RELEASE',
  news: 'NIEUWS',
  youtube: 'VIDEO',
  podcast: 'PODCAST',
  review: 'REVIEW',
  anecdote: 'ANEKDOTE',
  history: 'MUZIEKGESCHIEDENIS',
  fanwall: 'COMMUNITY',
  product: 'SHOP',
  concert: 'LEGENDARISCH CONCERT',
  metal_print: 'METAAL ART',
  tshirt: 'T-SHIRT',
  socks: 'SOKKEN',
};

export const useUnifiedNewsFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: ['unified-news-feed', limit],
    queryFn: async () => {
      const items: NewsItem[] = [];

      // Fetch album stories (where single_name is null)
      const { data: albums } = await supabase
        .from('music_stories')
        .select('id,title,artist,slug,artwork_url,created_at')
        .eq('is_published', true)
        .is('single_name', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (albums) {
        albums.forEach(a => items.push({
          id: a.id,
          type: 'album',
          title: a.title || 'Untitled',
          subtitle: a.artist || undefined,
          image_url: a.artwork_url || undefined,
          category_label: CATEGORY_LABELS.album,
          link: `/muziek-verhaal/${a.slug}`,
          date: a.created_at,
        }));
      }

      // Fetch singles
      const { data: singles } = await supabase
        .from('music_stories')
        .select('id,title,artist,single_name,slug,artwork_url,created_at')
        .eq('is_published', true)
        .not('single_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (singles) {
        singles.forEach(s => items.push({
          id: s.id,
          type: 'single',
          title: s.single_name || s.title || 'Untitled',
          subtitle: s.artist || undefined,
          image_url: s.artwork_url || undefined,
          category_label: CATEGORY_LABELS.single,
          link: `/singles/${s.slug}`,
          date: s.created_at,
        }));
      }

      // Fetch artist stories
      const { data: artists } = await supabase
        .from('artist_stories')
        .select('id,artist_name,slug,artwork_url,published_at,spotlight_description')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(8);

      if (artists) {
        artists.forEach(a => items.push({
          id: a.id,
          type: 'artist',
          title: a.artist_name,
          subtitle: undefined,
          image_url: a.artwork_url || undefined,
          category_label: CATEGORY_LABELS.artist,
          link: `/artists/${a.slug}`,
          date: a.published_at || new Date().toISOString(),
          description: a.spotlight_description || undefined,
        }));
      }

      // Fetch new releases
      const { data: releases } = await supabase
        .from('spotify_new_releases_processed')
        .select('id,album_name,artist_name,slug,album_image_url,release_date,created_at')
        .order('created_at', { ascending: false })
        .limit(8);

      if (releases) {
        releases.forEach(r => items.push({
          id: r.id,
          type: 'release',
          title: r.album_name,
          subtitle: r.artist_name,
          image_url: r.album_image_url || undefined,
          category_label: CATEGORY_LABELS.release,
          link: `/new-release/${r.slug}`,
          date: r.created_at,
        }));
      }

      // Fetch anecdotes
      const { data: anecdotes } = await supabase
        .from('music_anecdotes')
        .select('id,anecdote_title,subject_name,slug,created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (anecdotes) {
        anecdotes.forEach(a => items.push({
          id: a.id,
          type: 'anecdote',
          title: a.anecdote_title || 'Anekdote',
          subtitle: a.subject_name || undefined,
          image_url: undefined,
          category_label: CATEGORY_LABELS.anecdote,
          link: `/anekdotes/${a.slug}`,
          date: a.created_at,
        }));
      }

      // Fetch music history events
      const { data: history } = await supabase
        .from('music_history_events')
        .select('id,title,artist_name,image_url,created_at,event_date')
        .order('created_at', { ascending: false })
        .limit(6);

      if (history) {
        history.forEach(h => items.push({
          id: h.id,
          type: 'history',
          title: h.title,
          subtitle: h.artist_name || undefined,
          image_url: h.image_url || undefined,
          category_label: CATEGORY_LABELS.history,
          link: '/vandaag-in-de-muziekgeschiedenis',
          date: h.created_at,
        }));
      }

      // Fetch YouTube discoveries
      const { data: youtube } = await supabase
        .from('youtube_discoveries')
        .select('id,title,channel_name,thumbnail_url,video_id,created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (youtube) {
        youtube.forEach(y => items.push({
          id: y.id,
          type: 'youtube',
          title: y.title,
          subtitle: y.channel_name || undefined,
          image_url: y.thumbnail_url || undefined,
          category_label: CATEGORY_LABELS.youtube,
          link: `https://youtube.com/watch?v=${y.video_id}`,
          date: y.created_at,
        }));
      }

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('admin_album_reviews')
        .select('id,title,artist_name,album_title,slug,cover_image_url,created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (reviews) {
        reviews.forEach(r => items.push({
          id: r.id,
          type: 'review',
          title: r.title || `${r.artist_name} - ${r.album_title}`,
          subtitle: r.artist_name,
          image_url: r.cover_image_url || undefined,
          category_label: CATEGORY_LABELS.review,
          link: `/reviews/${r.slug}`,
          date: r.created_at || new Date().toISOString(),
        }));
      }

      // Fetch products (posters, etc.)
      const { data: products } = await supabase
        .from('platform_products')
        .select('id,artist_name,album_title,slug,image_url,created_at,media_type,categories')
        .not('categories', 'cs', '{"METAL"}')
        .order('created_at', { ascending: false })
        .limit(6);

      if (products) {
        products.forEach(p => items.push({
          id: p.id,
          type: 'product',
          title: `${p.artist_name} - ${p.album_title}`,
          subtitle: p.media_type || undefined,
          image_url: p.image_url || undefined,
          category_label: CATEGORY_LABELS.product,
          link: `/product/${p.slug}`,
          date: p.created_at,
        }));
      }

      // Fetch metal prints specifically
      const { data: metalPrints } = await supabase
        .from('platform_products')
        .select('id,artist_name,album_title,slug,image_url,created_at')
        .contains('categories', ['METAL'])
        .order('created_at', { ascending: false })
        .limit(4);

      if (metalPrints) {
        metalPrints.forEach(p => items.push({
          id: p.id,
          type: 'metal_print',
          title: `${p.artist_name} - ${p.album_title}`,
          subtitle: 'Metal Print',
          image_url: p.image_url || undefined,
          category_label: CATEGORY_LABELS.metal_print,
          link: `/product/${p.slug}`,
          date: p.created_at,
        }));
      }

      // Fetch T-shirts
      const { data: tshirts } = await supabase
        .from('album_tshirts')
        .select('id,artist_name,album_title,slug,album_cover_url,mockup_url,created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (tshirts) {
        tshirts.forEach(t => items.push({
          id: t.id,
          type: 'tshirt',
          title: `${t.artist_name} - ${t.album_title}`,
          subtitle: 'T-Shirt Design',
          image_url: t.mockup_url || t.album_cover_url || undefined,
          category_label: CATEGORY_LABELS.tshirt,
          link: `/tshirts/${t.slug}`,
          date: t.created_at,
        }));
      }

      // Fetch Socks
      const { data: socks } = await supabase
        .from('album_socks')
        .select('id,artist_name,album_title,slug,album_cover_url,mockup_url,created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (socks) {
        socks.forEach(s => items.push({
          id: s.id,
          type: 'socks',
          title: `${s.artist_name} - ${s.album_title}`,
          subtitle: 'Sokken Design',
          image_url: s.mockup_url || s.album_cover_url || undefined,
          category_label: CATEGORY_LABELS.socks,
          link: `/socks/${s.slug}`,
          date: s.created_at,
        }));
      }

      // Fetch News
      const { data: newsArticles } = await supabase
        .from('news_blog_posts')
        .select('id,title,slug,image_url,category,created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      if (newsArticles) {
        newsArticles.forEach(n => items.push({
          id: n.id,
          type: 'news',
          title: n.title,
          subtitle: n.category || undefined,
          image_url: n.image_url || undefined,
          category_label: CATEGORY_LABELS.news,
          link: `/nieuws/${n.slug}`,
          date: n.created_at || new Date().toISOString(),
        }));
      }

      // Fetch podcasts (curated episodes)
      const { data: podcasts } = await supabase
        .from('own_podcast_episodes')
        .select('id,title,description,podcast_id,audio_url,artwork_url,created_at,own_podcasts(name,artwork_url)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (podcasts) {
        podcasts.forEach(p => items.push({
          id: p.id,
          type: 'podcast',
          title: p.title,
          subtitle: (p.own_podcasts as any)?.name || undefined,
          image_url: p.artwork_url || (p.own_podcasts as any)?.artwork_url || undefined,
          category_label: CATEGORY_LABELS.podcast,
          link: '/de-plaat-en-het-verhaal',
          date: p.created_at,
        }));
      }

      // Fetch time machine events (concerts)
      const { data: concerts } = await supabase
        .from('time_machine_events')
        .select('id,event_title,venue_name,poster_image_url,slug,concert_date,created_at')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (concerts) {
        concerts.forEach(c => items.push({
          id: c.id,
          type: 'concert',
          title: c.event_title,
          subtitle: c.venue_name || undefined,
          image_url: c.poster_image_url || undefined,
          category_label: CATEGORY_LABELS.concert,
          link: `/time-machine/${c.slug}`,
          date: c.created_at,
        }));
      }

      // Sort all items by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return items.slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Get items by type
export const useNewsFeedByType = (type: NewsItem['type'], limit: number = 10) => {
  const { data: allItems, ...rest } = useUnifiedNewsFeed(100);
  
  const filteredItems = allItems?.filter(item => item.type === type).slice(0, limit) || [];
  
  return { data: filteredItems, ...rest };
};
