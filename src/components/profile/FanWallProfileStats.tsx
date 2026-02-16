import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Camera, Heart, Eye, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface FanWallProfileStatsProps {
  userId: string;
}

interface Stats {
  total_photos: number;
  total_likes: number;
  total_views: number;
  total_comments: number;
}

export const FanWallProfileStats: React.FC<FanWallProfileStatsProps> = ({ userId }) => {
  const { tr } = useLanguage();
  const p = tr.profile;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["fanwall-user-stats", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("like_count, view_count, comment_count")
        .eq("user_id", userId)
        .eq("status", "published");

      if (error) throw error;

      const totalPhotos = data?.length || 0;
      const totalLikes = data?.reduce((sum, photo) => sum + (photo.like_count || 0), 0) || 0;
      const totalViews = data?.reduce((sum, photo) => sum + (photo.view_count || 0), 0) || 0;
      const totalComments = data?.reduce((sum, photo) => sum + (photo.comment_count || 0), 0) || 0;

      return {
        total_photos: totalPhotos,
        total_likes: totalLikes,
        total_views: totalViews,
        total_comments: totalComments,
      } as Stats;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{p.fanwallStats}</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const statItems = [
    { label: p.photos, value: stats?.total_photos || 0, icon: Camera, color: "text-blue-500" },
    { label: p.likes, value: stats?.total_likes || 0, icon: Heart, color: "text-red-500" },
    { label: p.views, value: stats?.total_views || 0, icon: Eye, color: "text-green-500" },
    { label: p.engagement, value: ((stats?.total_likes || 0) + (stats?.total_comments || 0)), icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">{p.fanwallStats}</h3>
      
      <div className="space-y-4">
        {statItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="text-2xl font-bold">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {stats && stats.total_photos > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {p.avgViewsPerPhoto.replace('{count}', String(Math.round((stats.total_views || 0) / stats.total_photos)))}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
