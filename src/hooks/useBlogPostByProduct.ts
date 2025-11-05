import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostMatch {
  id: string;
  slug: string;
  markdown_content: string;
  yaml_frontmatter: any;
  published_at: string;
  album_cover_url?: string;
}

export const useBlogPostByProduct = (
  productId: string | null,
  artist: string | null,
  title: string,
  discogsId?: number | null
) => {
  return useQuery({
    queryKey: ["blog-post-by-product", productId, artist, title, discogsId],
    queryFn: async (): Promise<BlogPostMatch | null> => {
      // First priority: Direct product ID match
      if (productId) {
        const { data: directMatch } = await supabase
          .from("blog_posts")
          .select(`
            id,
            slug,
            markdown_content,
            yaml_frontmatter,
            published_at,
            album_cover_url
          `)
          .eq("album_id", productId)
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (directMatch) return directMatch;
      }

      // Second priority: Find by discogs_id if available
      if (discogsId) {
        // Find album in ai_scan_results or cd_scan by discogs_id
        const { data: scanData } = await supabase
          .from("ai_scan_results")
          .select("id")
          .eq("discogs_id", discogsId)
          .limit(1)
          .maybeSingle();

        if (scanData) {
          const { data: blogPost } = await supabase
            .from("blog_posts")
            .select(`
              id,
              slug,
              markdown_content,
              yaml_frontmatter,
              published_at,
              album_cover_url
            `)
            .eq("album_id", scanData.id)
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (blogPost) return blogPost;
        }
      }

      // Fallback: search by artist and title match
      if (artist && title) {
        // Extract clean album name from product title
        // Remove suffixes like "Album Cover", "[Metaalprint]", etc.
        const cleanTitle = title
          .replace(/Album Cover/gi, '')
          .replace(/\[.*?\]/g, '')  // Remove anything in brackets
          .replace(new RegExp(`${artist}\\s*-\\s*`, 'i'), '')  // Remove "Artist - "
          .trim();

        // Try exact match first
        let { data: blogPosts } = await supabase
          .from("blog_posts")
          .select(`
            id,
            slug,
            markdown_content,
            yaml_frontmatter,
            published_at,
            album_cover_url
          `)
          .eq("is_published", true)
          .ilike("yaml_frontmatter->>artist", `%${artist}%`)
          .ilike("yaml_frontmatter->>album", cleanTitle)
          .order("published_at", { ascending: false })
          .limit(1);

        if (blogPosts && blogPosts.length > 0) {
          return blogPosts[0];
        }

        // Fallback: partial match with cleaned title
        const { data: partialMatch } = await supabase
          .from("blog_posts")
          .select(`
            id,
            slug,
            markdown_content,
            yaml_frontmatter,
            published_at,
            album_cover_url
          `)
          .eq("is_published", true)
          .ilike("yaml_frontmatter->>artist", `%${artist}%`)
          .ilike("yaml_frontmatter->>album", `%${cleanTitle}%`)
          .order("published_at", { ascending: false })
          .limit(1);

        if (partialMatch && partialMatch.length > 0) {
          return partialMatch[0];
        }
      }

      return null;
    },
    enabled: !!title,
  });
};
