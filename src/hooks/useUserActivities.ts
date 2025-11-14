import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserActivity {
  id: string;
  type: 'ai_scan' | 'cd_scan' | 'vinyl_scan' | 'blog_post' | 'shop_order_buy' | 'shop_order_sell' | 'quiz_result' | 'follow';
  description: string;
  details?: string;
  timestamp: string;
  metadata?: any;
}

export const useUserActivities = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ["user-activities-admin", userId, limit],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!userId) return [];

      const activities: UserActivity[] = [];

      // Parallel fetch all activity types
      const [
        aiScans,
        cdScans,
        vinylScans,
        blogPosts,
        shopOrdersBuy,
        shopOrdersSell,
        quizResults,
        follows
      ] = await Promise.all([
        // AI Scans
        supabase
          .from("ai_scan_results")
          .select("id, status, created_at, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // CD Scans
        supabase
          .from("cd_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Vinyl Scans
        supabase
          .from("vinyl2_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Blog Posts
        supabase
          .from("blog_posts")
          .select("id, yaml_frontmatter, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Shop Orders (as buyer)
        supabase
          .from("shop_orders")
          .select("id, total_amount, status, created_at")
          .eq("buyer_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Shop Orders (as seller)
        supabase
          .from("shop_orders")
          .select("id, total_amount, status, created_at")
          .eq("seller_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Quiz Results
        supabase
          .from("quiz_results")
          .select("id, score_percentage, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        
        // Follows
        supabase
          .from("user_follows")
          .select("id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)
      ]);

      // Process AI Scans
      if (aiScans.data) {
        aiScans.data.forEach(scan => {
          activities.push({
            id: scan.id,
            type: "ai_scan",
            description: "AI Scan uitgevoerd",
            details: scan.status,
            timestamp: scan.created_at,
            metadata: scan.metadata
          });
        });
      }

      // Process CD Scans
      if (cdScans.data) {
        cdScans.data.forEach(scan => {
          activities.push({
            id: scan.id,
            type: "cd_scan",
            description: "CD toegevoegd",
            details: `${scan.artist} - ${scan.title}`,
            timestamp: scan.created_at
          });
        });
      }

      // Process Vinyl Scans
      if (vinylScans.data) {
        vinylScans.data.forEach(scan => {
          activities.push({
            id: scan.id,
            type: "vinyl_scan",
            description: "Vinyl toegevoegd",
            details: `${scan.artist} - ${scan.title}`,
            timestamp: scan.created_at
          });
        });
      }

      // Process Blog Posts
      if (blogPosts.data) {
        blogPosts.data.forEach(post => {
          const frontmatter = post.yaml_frontmatter as any;
          activities.push({
            id: post.id,
            type: "blog_post",
            description: "Blog post gepubliceerd",
            details: frontmatter?.title || "Geen titel",
            timestamp: post.created_at
          });
        });
      }

      // Process Shop Orders (buyer)
      if (shopOrdersBuy.data) {
        shopOrdersBuy.data.forEach(order => {
          activities.push({
            id: order.id,
            type: "shop_order_buy",
            description: "Bestelling geplaatst",
            details: `€${order.total_amount.toFixed(2)} - ${order.status}`,
            timestamp: order.created_at
          });
        });
      }

      // Process Shop Orders (seller)
      if (shopOrdersSell.data) {
        shopOrdersSell.data.forEach(order => {
          activities.push({
            id: order.id,
            type: "shop_order_sell",
            description: "Item verkocht",
            details: `€${order.total_amount.toFixed(2)} - ${order.status}`,
            timestamp: order.created_at
          });
        });
      }

      // Process Quiz Results
      if (quizResults.data) {
        quizResults.data.forEach(result => {
          activities.push({
            id: result.id,
            type: "quiz_result",
            description: "Quiz voltooid",
            details: `Score: ${Math.round(result.score_percentage)}%`,
            timestamp: result.created_at
          });
        });
      }

      // Process Follows
      if (follows.data) {
        follows.data.forEach(follow => {
          activities.push({
            id: follow.id,
            type: "follow",
            description: "Begon iemand te volgen",
            timestamp: follow.created_at
          });
        });
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    enabled: !!userId,
  });
};
