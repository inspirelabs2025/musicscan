import { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthSession } from '@supabase/supabase-js';
import useSupabase from '@/hooks/useSupabase';

interface AuthContextType {
  session: AuthSession | null;
  sessionFetched: boolean;
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  sessionFetched: false,
  setSession: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionFetched, setSessionFetched] = useState(false);
  const { supabase } = useSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionFetched(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSessionFetched(true);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ session, sessionFetched, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
