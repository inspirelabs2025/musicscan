import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export interface DashboardActivity {
  id: string;
  type: 'cd_scan' | 'vinyl_scan' | 'ai_scan' | 'quiz' | 'blog' | 'order' | 'follow';
  description: string;
  details?: string;
  timestamp: string;
  icon: string;
}

export const useDashboardActivity = () => {
  const { user } = useAuth();
  const { tr } = useLanguage();

  return useQuery({
    queryKey: ["dashboard-activity", user?.id, tr],
    queryFn: async (): Promise<DashboardActivity[]> => {
      if (!user?.id) return [];

      const activities: DashboardActivity[] = [];

      const [cdScans, vinylScans, aiScans, quizResults, blogPosts, shopOrders, follows] = await Promise.all([
        supabase
          .from("cd_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("vinyl2_scan")
          .select("id, artist, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("ai_scan_results")
          .select("id, artist, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("quiz_results")
          .select("id, score_percentage, quiz_type, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("blog_posts")
          .select("id, yaml_frontmatter, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("shop_orders")
          .select("id, total_amount, status, created_at")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("user_follows")
          .select("id, created_at")
          .eq("follower_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const d = tr.dashboard as any;

      if (cdScans.data) {
        cdScans.data.forEach(s => activities.push({
          id: s.id, type: 'cd_scan', icon: '💿',
          description: d.activityCdAdded || 'CD toegevoegd',
          details: `${s.artist} - ${s.title}`,
          timestamp: s.created_at,
        }));
      }

      if (vinylScans.data) {
        vinylScans.data.forEach(s => activities.push({
          id: s.id, type: 'vinyl_scan', icon: '🎵',
          description: d.activityVinylAdded || 'Vinyl toegevoegd',
          details: `${s.artist} - ${s.title}`,
          timestamp: s.created_at,
        }));
      }

      if (aiScans.data) {
        aiScans.data.forEach(s => activities.push({
          id: s.id, type: 'ai_scan', icon: '📸',
          description: d.activityScanDone || 'Scan uitgevoerd',
          details: s.artist && s.title ? `${s.artist} - ${s.title}` : undefined,
          timestamp: s.created_at,
        }));
      }

      if (quizResults.data) {
        quizResults.data.forEach(r => activities.push({
          id: r.id, type: 'quiz', icon: '🏆',
          description: d.activityQuizDone || 'Quiz voltooid',
          details: `Score: ${Math.round(r.score_percentage)}%`,
          timestamp: r.created_at,
        }));
      }

      if (blogPosts.data) {
        blogPosts.data.forEach(p => {
          const fm = p.yaml_frontmatter as any;
          activities.push({
            id: p.id, type: 'blog', icon: '✍️',
            description: d.activityBlogPublished || 'Blog gepubliceerd',
            details: fm?.title || undefined,
            timestamp: p.created_at,
          });
        });
      }

      if (shopOrders.data) {
        shopOrders.data.forEach(o => activities.push({
          id: o.id, type: 'order', icon: '🛒',
          description: d.activityOrderPlaced || 'Bestelling geplaatst',
          details: `€${o.total_amount?.toFixed(2)}`,
          timestamp: o.created_at,
        }));
      }

      if (follows.data) {
        follows.data.forEach(f => activities.push({
          id: f.id, type: 'follow', icon: '👥',
          description: d.activityStartedFollowing || 'Begon iemand te volgen',
          timestamp: f.created_at,
        }));
      }

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!user?.id,
  });
};
