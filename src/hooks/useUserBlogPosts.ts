import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserBlogPost {
  id: string;
  slug: string;
  yaml_frontmatter: any;
  views_count: number;
  album_type: string;
  published_at: string;
  created_at: string;
}

export const useUserBlogPosts = (userId: string) => {
  return useQuery({
    queryKey: ["user-blog-posts", userId],
    queryFn: async (): Promise<UserBlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          id,
          slug,
          yaml_frontmatter,
          views_count,
          album_type,
          published_at,
          created_at
        `)
        .eq("user_id", userId)
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};