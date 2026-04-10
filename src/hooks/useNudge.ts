import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabaseClient';

type NudgeVariant = 'control' | 'nudge' | 'chat_nudge'; // Added 'chat_nudge'

interface NudgeConfig {
  key: string;
  envVarName: string;
  criteria?: (userId: string) => Promise<boolean>;
  // Add specific criteria for each nudge type here.
  // For example, for 'chat_nudge':
  chatNudgeCriteria?: (projectId: string) => Promise<boolean>;
}

// Helper to get environment variable or null
const getEnvVar = (name: string): string | null => {
  return import.meta.env[name] || null;
};

export const useNudge = (nudgeKey: string, envVarName: string, projectId?: string) => {
  const { user } = useAuth();
  const [shouldShowNudge, setShouldShowNudge] = useState(false);
  const [variant, setVariant] = useState<NudgeVariant>('control');
  const hasCheckedNudge = useRef(false); // To prevent multiple checks on re-render

  const assignVariant = useCallback((): NudgeVariant => {
    const envVariant = getEnvVar(envVarName) as NudgeVariant | null;
    if (envVariant) {
      return envVariant;
    }

    // Client-side A/B test assignment
    const storedVariant = localStorage.getItem(`nudge-variant-${nudgeKey}`) as NudgeVariant;
    if (storedVariant) {
      return storedVariant;
    }

    const newVariant: NudgeVariant = Math.random() < 0.5 ? 'nudge' : 'control'; // Default to existing 'nudge' vs 'control'

    // Specific logic for chat_nudge if needed, e.g., 50/50 split between 'control' and 'chat_nudge'
    if (nudgeKey === 'chat_nudge') {
        const chatNudgeAssignment: NudgeVariant = Math.random() < 0.5 ? 'chat_nudge' : 'control';
        localStorage.setItem(`nudge-variant-${nudgeKey}`, chatNudgeAssignment);
        return chatNudgeAssignment;
    }

    localStorage.setItem(`nudge-variant-${nudgeKey}`, newVariant);
    return newVariant;
  }, [nudgeKey, envVarName]);

  const checkChatNudgeCriteria = useCallback(async (currentProjectId: string): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('project_id', currentProjectId);

      if (error) {
        console.error('Error fetching chat messages for nudge:', error.message);
        return false;
      }

      return (count === 0);
    } catch (e) {
      console.error('Exception while checking chat nudge criteria:', e);
      return false;
    }
  }, []);

  const dismissNudge = useCallback(() => {
    setShouldShowNudge(false);
    localStorage.setItem(`nudge-dismissed-${nudgeKey}`, 'true');
    // Optionally, log this dismissal to analytics or backend
  }, [nudgeKey]);

  useEffect(() => {
    if (user && !hasCheckedNudge.current) {
      hasCheckedNudge.current = true; // Mark as checked

      const assignedVariant = assignVariant();
      setVariant(assignedVariant);

      const hasBeenDismissed = localStorage.getItem(`nudge-dismissed-${nudgeKey}`);
      if (hasBeenDismissed === 'true') {
        setShouldShowNudge(false);
        return;
      }

      const evaluateNudge = async () => {
        let show = false;
        if (assignedVariant === 'chat_nudge' && projectId) {
          const criteriaMet = await checkChatNudgeCriteria(projectId);
          show = criteriaMet;
        } else if (assignedVariant === 'nudge') {
          // Generic 'nudge' criteria (e.g., based on user activity, feature usage etc.) might go here
          // For now, assuming if it's 'nudge' and specific criteria not matched, it might default to showing if no specific criteria
          // Or, better, define clear criteria for 'nudge' vs 'chat_nudge'
          show = false; // For now, explicit for chat_nudge, original 'nudge' might have other specific criteria.
        }
        setShouldShowNudge(show);
      };

      evaluateNudge();
    }
  }, [user, assignVariant, nudgeKey, projectId, checkChatNudgeCriteria]);

  // Return the variant as well, in case components want to render differently
  return { shouldShowNudge, dismissNudge, variant };
};
