import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCollectionViewTracker = () => {
  const trackViewMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Check if we already tracked a view for this user in this session
      const sessionKey = `collection_viewed_${userId}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Don't track multiple views in the same session
      }

      // Mark as viewed in this session
      sessionStorage.setItem(sessionKey, 'true');

      // Get current profile to increment view count
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('collection_views')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile for view tracking:', fetchError);
        return;
      }

      const currentViews = profile?.collection_views || 0;

      // Update view count in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          collection_views: currentViews + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error tracking collection view:', error);
        throw error;
      }
    },
  });

  return {
    trackView: trackViewMutation.mutate,
    isTracking: trackViewMutation.isPending,
  };
};