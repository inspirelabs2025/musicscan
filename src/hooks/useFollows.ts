import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export const useFollowers = (userId: string) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          *,
          follower:profiles!user_follows_follower_id_fkey(
            user_id,
            first_name,
            avatar_url,
            is_public
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useFollowing = (userId: string) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          *,
          following:profiles!user_follows_following_id_fkey(
            user_id,
            first_name,
            avatar_url,
            is_public
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useIsFollowing = (targetUserId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isFollowing", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) return false;

      const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });
};

export const useToggleFollow = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (user.id === targetUserId) throw new Error("Cannot follow yourself");

      // Check if already following
      const { data: existingFollow } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("id", existingFollow.id);

        if (error) throw error;
        return { action: "unfollowed" };
      } else {
        // Follow
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
        return { action: "followed" };
      }
    },
    onSuccess: (result, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["followers", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast({
        title: result.action === "followed" ? "Gevolgd" : "Ontvolgen",
        description: result.action === "followed" 
          ? "Je volgt deze gebruiker nu." 
          : "Je volgt deze gebruiker niet meer.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });
};