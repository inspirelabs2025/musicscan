import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewReleaseDetail {
  id: string;
  spotify_album_id: string;
  artist: string;
  album_name: string;
  release_date: string | null;
  spotify_url: string | null;
  image_url: string | null;
  discogs_id: number | null;
  product_id: string | null;
  blog_id: string | null;
  status: string;
  slug: string;
  created_at: string;
}

export const useNewReleaseDetail = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['new-release-detail', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        console.error('Error fetching new release:', error);
        throw error;
      }
      
      return data as NewReleaseDetail;
    },
    enabled: !!slug,
  });
};

export const useNewReleases = () => {
  return useQuery({
    queryKey: ['new-releases-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('id, artist, album_name, image_url, spotify_url, release_date, slug, product_id, blog_id')
        .order('release_date', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching new releases:', error);
        throw error;
      }
      
      return data as NewReleaseDetail[];
    },
  });
};
