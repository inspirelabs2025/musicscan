import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Activity {
  type: "collection_add" | "blog_post" | "quiz_completed" | "follow";
  description: string;
  details?: string;
  timestamp: string;
}

export const useUserActivity = (userId: string) => {
  const { tr } = useLanguage();
  const p = tr.profile;

  return useQuery({
    queryKey: ["user-activity", userId, tr],
    queryFn: async (): Promise<Activity[]> => {
      const activities: Activity[] = [];

      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", userId)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("vinyl2_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", userId)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (cdResults.data) {
        cdResults.data.forEach(item => {
          activities.push({
            type: "collection_add",
            description: p.addedCDToCollection || "Added CD to collection",
            details: `${item.artist} - ${item.title}`,
            timestamp: item.created_at
          });
        });
      }

      if (vinylResults.data) {
        vinylResults.data.forEach(item => {
          activities.push({
            type: "collection_add",
            description: p.addedVinylToCollection || "Added vinyl to collection",
            details: `${item.artist} - ${item.title}`,
            timestamp: item.created_at
          });
        });
      }

      const blogResults = await supabase
        .from("blog_posts")
        .select("id, yaml_frontmatter, created_at")
        .eq("user_id", userId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (blogResults.data) {
        blogResults.data.forEach(post => {
          const frontmatter = post.yaml_frontmatter as any;
          activities.push({
            type: "blog_post",
            description: p.publishedBlogPost || "Published blog post",
            details: frontmatter?.title || "Blog post",
            timestamp: post.created_at
          });
        });
      }

      const quizResults = await supabase
        .from("quiz_results")
        .select("id, score_percentage, quiz_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (quizResults.data) {
        quizResults.data.forEach(result => {
          activities.push({
            type: "quiz_completed",
            description: p.completedQuiz || "Completed quiz",
            details: `Score: ${Math.round(result.score_percentage)}%`,
            timestamp: result.created_at
          });
        });
      }

      const followResults = await supabase
        .from("user_follows")
        .select("id, following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (followResults.data) {
        followResults.data.forEach(follow => {
          activities.push({
            type: "follow",
            description: p.startedFollowing || "Started following someone",
            details: p.newConnection || "New connection",
            timestamp: follow.created_at
          });
        });
      }

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!userId,
  });
};
