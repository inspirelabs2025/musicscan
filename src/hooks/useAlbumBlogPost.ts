import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AlbumBlogPost {
  id: string;
  slug: string;
  markdown_content: string;
  yaml_frontmatter: any;
  published_at: string;
  album_cover_url?: string;
}

export const useAlbumBlogPost = (albumId: string | null) => {
  return useQuery({
    queryKey: ["album-blog-post", albumId],
    queryFn: async (): Promise<AlbumBlogPost | null> => {
      if (!albumId) return null;

      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          id,
          slug, 
          markdown_content,
          yaml_frontmatter,
          published_at,
          album_cover_url
        `)
        .eq("album_id", albumId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!albumId,
  });
};