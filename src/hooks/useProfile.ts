import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface Profile {
  user_id: string;
  first_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  is_public: boolean;
  allow_messages: boolean;
  show_collection: boolean;
  show_activity: boolean;
  last_active_at: string;
  total_followers: number;
  total_following: number;
  created_at: string;
  updated_at: string;
  // Spotify fields
  spotify_connected: boolean | null;
  spotify_user_id: string | null;
  spotify_display_name: string | null;
  spotify_email: string | null;
  spotify_refresh_token: string | null;
  spotify_last_sync: string | null;
  spotify_sync_enabled: boolean | null;
  // Onboarding fields
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  onboarding_skipped: boolean | null;
  last_onboarding_at: string | null;
}

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["profile", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!targetUserId,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profiel is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het bijwerken van je profiel.",
        variant: "destructive",
      });
    },
  });
};