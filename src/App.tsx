import { useContext, useEffect, useState } from 'react';
import { supabase } from '@supabase/supabase-js';
import { AuthSession } from '@supabase/supabase-js';

import { Toaster } from 'sonner';
import useSupabase from '@/hooks/useSupabase';
import AuthContext from './contexts/AuthContext';
import { PageLoader } from './components/app/page-loader';
import AppRoutes from './AppRoutes';
import { AiNudge } from './components/ui/ai-nudge';

function App() {
  const { sessionFetched } = useContext(AuthContext);
  const [session, setSession] = useState<AuthSession | null>(null);
  const { supabase } = useSupabase();

  const aiNudgeVariant = import.meta.env.VITE_AI_NUDGE_VARIANT || 'default';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, [supabase]);

  if (!sessionFetched) {
    return <PageLoader />;
  }

  return (
    <div className="h-full w-full">
      {
        // Conditionally render the AI Nudge based on experiment variant
        // 'ai-nudge' and 'chat-nudge' are example variants.
        // 'default' implies no specific nudge or a fallback.
        aiNudgeVariant === 'ai-nudge' && (
          <div className="fixed bottom-4 right-4 z-[9999] w-80">
            <AiNudge variant="ai-nudge" />
          </div>
        )
      }
      <AppRoutes session={session} />
      <Toaster />
    </div>
  );
}

export default App;
