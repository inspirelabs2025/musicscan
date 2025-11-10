import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const usePhotoLike = (photoId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has liked this photo
  const { data: isLiked, isLoading } = useQuery({
    queryKey: ["photo-like", photoId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("photo_likes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!photoId,
  });

  // Subscribe to real-time updates for this photo's likes
  useEffect(() => {
    if (!photoId) return;

    const channel = supabase
      .channel(`photo-likes-${photoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_likes',
          filter: `photo_id=eq.${photoId}`
        },
        () => {
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["photo-like", photoId] });
          queryClient.invalidateQueries({ queryKey: ["photo", photoId] });
          queryClient.invalidateQueries({ queryKey: ["fanwall-photos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, queryClient]);

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login vereist");

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("photo_likes")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("photo_likes")
          .insert({
            photo_id: photoId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-like", photoId] });
      queryClient.invalidateQueries({ queryKey: ["photo", photoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    isLiked: isLiked ?? false,
    isLoading,
    toggleLike: toggleLikeMutation.mutate,
    isToggling: toggleLikeMutation.isPending,
  };
};

// Hook to get liked photos for a user
export const useLikedPhotos = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["liked-photos", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("photo_likes")
        .select(`
          id,
          created_at,
          photos (
            id,
            display_url,
            seo_slug,
            seo_title,
            artist,
            year,
            like_count,
            comment_count,
            view_count
          )
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
};
