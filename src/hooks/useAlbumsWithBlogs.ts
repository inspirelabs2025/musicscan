import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AlbumWithBlog {
  id: string;
  artist: string;
  title: string;
  year?: number;
  genre?: string;
  discogs_id?: number;
  created_at: string;
  condition_grade?: string;
  estimated_value?: number;
}

export const useAlbumsWithBlogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["albums-with-blogs", user?.id],
    queryFn: async (): Promise<AlbumWithBlog[]> => {
      const userId = user?.id;

      // Fetch published blog posts with album data
      let query = supabase
        .from("blog_posts")
        .select(`
          album_id,
          yaml_frontmatter,
          published_at,
          created_at
        `)
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      // Filter by user if logged in
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: blogPosts, error } = await query;
      if (error) throw error;

      if (!blogPosts || blogPosts.length === 0) {
        return [];
      }

      // Extract album data from yaml_frontmatter and transform to AlbumWithBlog format
      const albums: AlbumWithBlog[] = blogPosts
        .map(post => {
          const frontmatter = post.yaml_frontmatter as any; // Type assertion for Json type
          
          return {
            id: post.album_id,
            artist: frontmatter?.artist || 'Onbekende Artiest',
            title: frontmatter?.title || 'Onbekende Titel',
            year: frontmatter?.year ? parseInt(frontmatter.year) : undefined,
            genre: frontmatter?.genre,
            discogs_id: frontmatter?.discogs_id ? parseInt(frontmatter.discogs_id) : undefined,
            created_at: post.published_at || post.created_at,
            condition_grade: frontmatter?.condition,
            estimated_value: frontmatter?.estimated_price ? parseFloat(frontmatter.estimated_price) : undefined,
          };
        })
        .filter(album => album.artist && album.title); // Only include albums with valid data

      return albums;
    },
    enabled: true,
  });
};