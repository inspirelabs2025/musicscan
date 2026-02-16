import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface FanWallProfileGalleryProps {
  userId: string;
}

interface Photo {
  id: string;
  display_url: string;
  title: string | null;
  artist: string | null;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  slug: string;
}

export const FanWallProfileGallery: React.FC<FanWallProfileGalleryProps> = ({ userId }) => {
  const { tr } = useLanguage();
  const p = tr.profile;

  const { data: photos, isLoading } = useQuery({
    queryKey: ["fanwall-user-photos", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, display_url, title, artist, like_count, comment_count, view_count, slug")
        .eq("user_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as Photo[];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{p.fanwallPhotos}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{p.fanwallPhotos}</h3>
        <p className="text-muted-foreground text-center py-8">
          {p.noPhotosUploaded}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{p.fanwallPhotos}</h3>
        <span className="text-sm text-muted-foreground">
          {photos.length} {p.photo}{photos.length !== 1 ? "'s" : ""}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            to={`/fanwall/${photo.slug}`}
            className="group relative aspect-square overflow-hidden rounded-lg"
          >
            <img
              src={photo.display_url}
              alt={photo.title || "FanWall"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white">
                <Heart className="h-4 w-4" />
                <span className="text-sm">{photo.like_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{photo.comment_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{photo.view_count || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {photos.length >= 12 && (
        <div className="mt-4 text-center">
          <Link
            to={`/fanwall?user=${userId}`}
            className="text-sm text-primary hover:underline"
          >
            {p.viewAllPhotos}
          </Link>
        </div>
      )}
    </Card>
  );
};
