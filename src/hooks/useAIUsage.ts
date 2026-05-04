import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export const useAIUsage = () => {
  const [hasUsedAI, setHasUsedAI] = useState(true); // Default to true to hide nudge by default

  useEffect(() => {
    const fetchAIUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if there's any record in the 'ai_usage' table for the current user
        // You might need to adjust this query based on your actual 'ai_usage' table schema
        const { count, error } = await supabase
          .from('ai_usage')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching AI usage:', error);
          setHasUsedAI(true); // Assume AI is used on error to hide nudge
          return;
        }

        setHasUsedAI((count || 0) > 0);
      } else {
        setHasUsedAI(true); // If no user, assume AI is used or not applicable to hide nudge
      }
    };

    fetchAIUsage();

    // Listen for auth state changes to re-fetch if user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchAIUsage();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { hasUsedAI };
};
