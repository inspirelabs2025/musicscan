import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useAiUsage = () => {
  const [aiUsageCount, setAiUsageCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAiUsage = async () => {
      setLoading(true);
      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (user?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('ai_feature_usage_count')
          .eq('id', user.user.id)
          .single();

        if (profileError) {
          setError(profileError.message);
        } else {
          setAiUsageCount(profile?.ai_feature_usage_count || 0);
        }
      }
      setLoading(false);
    };

    fetchAiUsage();

    // Listen for changes in authentication state
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchAiUsage(); // Refetch if user logs in
      } else {
        setAiUsageCount(null); // Clear usage count if user logs out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const incrementAiUsage = async () => {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user for AI usage increment:', userError.message);
      return;
    }

    if (user?.user) {
      const newCount = (aiUsageCount || 0) + 1;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ai_feature_usage_count: newCount })
        .eq('id', user.user.id);

      if (updateError) {
        console.error('Error updating AI feature usage:', updateError.message);
      } else {
        setAiUsageCount(newCount);
      }
    }
  };

  const dismissAiNudge = async () => {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user for AI nudge dismissal:', userError.message);
      return;
    }

    if (user?.user) {
      // Set usage count to 1 to dismiss the nudge, even if AI wasn't truly used yet.
      // This ensures the nudge does not reappear until AI is actually used.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ai_feature_usage_count: 1 }) 
        .eq('id', user.user.id);

      if (updateError) {
        console.error('Error dismissing AI nudge:', updateError.message);
      } else {
        setAiUsageCount(1);
      }
    }
  };

  return { aiUsageCount, incrementAiUsage, dismissAiNudge, loading, error };
};
