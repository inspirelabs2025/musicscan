import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

// A component to record AI usage whenever an AI-related page is visited.
// This uses a very general pattern; actual AI usage might need more detailed
// event triggers (e.g., after an AI generation completes).
export function RecordUsage() {
  const location = useLocation();

  useEffect(() => {
    const recordAISession = async () => {
      // Define paths that are considered 'AI-related'
      const aiPaths = [
        '/ai-monitization',
        // Add other AI-related paths here if applicable
      ];

      if (aiPaths.some(path => location.pathname.startsWith(path))) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log(`Recording AI usage for user ${user.id} on path ${location.pathname}`);
          // Insert a record into 'ai_usage' table
          const { error } = await supabase
            .from('ai_usage')
            .insert({
              user_id: user.id,
              event: `viewed_ai_page: ${location.pathname}`,
              timestamp: new Date().toISOString(),
            });

          if (error) {
            console.error('Error recording AI usage:', error);
          }
        }
      }
    };

    recordAISession();
  }, [location.pathname]);

  return null; // This component doesn't render anything
}
