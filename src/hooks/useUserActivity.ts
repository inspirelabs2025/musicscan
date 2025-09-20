import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  type: "collection_add" | "blog_post" | "quiz_completed" | "follow";
  description: string;
  details?: string;
  timestamp: string;
}

export const useUserActivity = (userId: string) => {
  return useQuery({
    queryKey: ["user-activity", userId],
    queryFn: async (): Promise<Activity[]> => {
      const activities: Activity[] = [];

      // Get recent collection additions
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

      // Process collection additions
      if (cdResults.data) {
        cdResults.data.forEach(item => {
          activities.push({
            type: "collection_add",
            description: "Voegde CD toe aan collectie",
            details: `${item.artist} - ${item.title}`,
            timestamp: item.created_at
          });
        });
      }

      if (vinylResults.data) {
        vinylResults.data.forEach(item => {
          activities.push({
            type: "collection_add",
            description: "Voegde vinyl toe aan collectie",
            details: `${item.artist} - ${item.title}`,
            timestamp: item.created_at
          });
        });
      }

      // Get recent blog posts
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
            description: "Publiceerde blog post",
            details: frontmatter?.title || "Blog post",
            timestamp: post.created_at
          });
        });
      }

      // Get recent quiz results
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
            description: "Voltooide quiz",
            details: `Score: ${Math.round(result.score_percentage)}%`,
            timestamp: result.created_at
          });
        });
      }

      // Get recent follows (who this user started following)
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
            description: "Begon iemand te volgen",
            details: "Nieuwe connectie",
            timestamp: follow.created_at
          });
        });
      }

      // Sort all activities by timestamp and return
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!userId,
  });
};