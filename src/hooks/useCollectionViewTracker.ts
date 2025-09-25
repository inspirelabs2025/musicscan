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

      // For now, just track in session storage since types aren't updated yet
      // In the future, this could be enhanced to track actual database views
      console.log(`Collection view tracked for user: ${userId}`);
    },
  });

  return {
    trackView: trackViewMutation.mutate,
    isTracking: trackViewMutation.isPending,
  };
};