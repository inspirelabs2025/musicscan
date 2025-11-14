import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  yaml_frontmatter?: any;
  story_content?: string;
  artwork_url?: string;
  views_count?: number;
  created_at: string;
}

interface MuziekVerhaal {
  id: string;
  title: string;
  slug: string;
  artist?: string;
  single_name?: string;
  story_content?: string;
  artwork_url?: string;
  views_count?: number;
  created_at: string;
}

interface PlatformProduct {
  id: string;
  title: string;
  artist: string | null;
  primary_image: string | null;
  price: number;
  slug: string;
  media_type: string;
  categories: string[];
}

interface CollectionItem {
  id: string;
  artist: string;
  title: string;
  media_type: string;
  artwork_url?: string;
  created_at: string;
}

interface Release {
  id: string;
  artist: string;
  album_title: string;
  artwork_url?: string;
  release_date?: string;
}

interface ArtistStory {
  id: string;
  artist_name: string;
  slug: string;
  story_content?: string;
  music_style?: string[];
}

export interface ArtistSearchResults {
  verhalen: BlogPostListItem[];
  singles: MuziekVerhaal[];
  products: PlatformProduct[];
  collectie: CollectionItem[];
  releases: Release[];
  artistInfo?: ArtistStory;
  totalResults: number;
  isLoading: boolean;
}

export const useArtistSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['artist-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          verhalen: [],
          singles: [],
          products: [],
          collectie: [],
          releases: [],
          artistInfo: undefined,
          totalResults: 0,
          isLoading: false,
        };
      }

      const searchPattern = `%${searchTerm.trim()}%`;

      // Parallel fetch all data sources
      const [
        blogPostsResult,
        musicStoriesResult,
        productsResult,
        cdResult,
        vinylResult,
        releasesResult,
        artistStoryResult,
      ] = await Promise.allSettled([
        // Blog posts (album verhalen)
        supabase
          .from('blog_posts')
          .select('id, title, slug, status, yaml_frontmatter, story_content, artwork_url, views_count, created_at')
          .eq('status', 'published')
          .ilike('yaml_frontmatter->>artist', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Music stories (single verhalen)
        supabase
          .from('music_stories')
          .select('id, title, slug, artist, single_name, story_content, artwork_url, views_count, created_at')
          .eq('is_published', true)
          .ilike('artist', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Platform products
        supabase
          .from('platform_products')
          .select('id, title, artist, primary_image, price, slug, media_type, categories')
          .eq('status', 'active')
          .ilike('artist', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // CD collection
        supabase
          .from('cd_scan')
          .select('id, artist, title, media_type, artwork_url, created_at')
          .eq('is_public', true)
          .ilike('artist', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Vinyl collection
        supabase
          .from('vinyl2_scan')
          .select('id, artist, title, media_type, artwork_url, created_at')
          .eq('is_public', true)
          .ilike('artist', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Releases
        supabase
          .from('releases')
          .select('id, artist, album_title, artwork_url, release_date')
          .ilike('artist', searchPattern)
          .order('release_date', { ascending: false })
          .limit(10),
        
        // Artist stories
        supabase
          .from('artist_stories')
          .select('id, artist_name, slug, story_content, music_style')
          .eq('is_published', true)
          .ilike('artist_name', searchPattern)
          .single(),
      ]);

      const verhalen = blogPostsResult.status === 'fulfilled' && blogPostsResult.value.data 
        ? blogPostsResult.value.data 
        : [];
      
      const singles = musicStoriesResult.status === 'fulfilled' && musicStoriesResult.value.data
        ? musicStoriesResult.value.data
        : [];
      
      const products = productsResult.status === 'fulfilled' && productsResult.value.data
        ? productsResult.value.data
        : [];
      
      const cdItems = cdResult.status === 'fulfilled' && cdResult.value.data
        ? cdResult.value.data
        : [];
      
      const vinylItems = vinylResult.status === 'fulfilled' && vinylResult.value.data
        ? vinylResult.value.data
        : [];
      
      const releases = releasesResult.status === 'fulfilled' && releasesResult.value.data
        ? releasesResult.value.data
        : [];
      
      const artistInfo = artistStoryResult.status === 'fulfilled' && artistStoryResult.value.data
        ? artistStoryResult.value.data
        : undefined;

      const collectie = [...cdItems, ...vinylItems];

      const totalResults = 
        verhalen.length +
        singles.length +
        products.length +
        collectie.length +
        releases.length +
        (artistInfo ? 1 : 0);

      return {
        verhalen,
        singles,
        products,
        collectie,
        releases,
        artistInfo,
        totalResults,
        isLoading: false,
      };
    },
    enabled: searchTerm.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
