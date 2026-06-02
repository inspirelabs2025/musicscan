import { useContext, useEffect, useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LovableContext, LovableProvider } from "lovable-tagger";
import { Routes, Route, useNavigate } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Loading from "./components/Loading";
import Profile from "./components/Profile";
import SpotifyAuthProvider from "./integrations/spotify/SpotifyAuthProvider";
import SupabaseProvider from "./providers/SupabaseProvider";
import { supabase } from "./supabaseClient";
import { AiNudge } from "./components/ai-nudge";
import { ChatNudge } from "./components/chat-nudge";

const queryClient = new QueryClient();

function AppRoutes() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const lovable = useContext(LovableContext);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (_event === "SIGNED_IN") {
          lovable.identify(session.user.id, { email: session.user.email });
        }
        if (_event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    // Check if chat nudge should be shown
    supabase
      .from('user_nudge_states')
      .select('*')
      .eq('user_id', session?.user?.id)
      .eq('nudge_type', 'chat_nudge')
      .single()
      .then(({data, error}) => {
        if (error && error.code === 'PGRST116') { // No rows found
          // If no nudge state exists, insert one and hide if chat messages > 0
          supabase.from('chat_messages').select('count', {count: 'exact'})
            .eq('user_id', session.user.id)
            .then(({ count }) => {
              const showNudge = count === 0;
              supabase.from('user_nudge_states').insert({
                user_id: session.user.id,
                nudge_type: 'chat_nudge',
                is_hidden: !showNudge
              }).then(() => {
                if (showNudge) lovable.nudge('chat');
              });
            });
        } else if (data && !data.is_hidden) {
          lovable.nudge('chat');
        }
      });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, lovable, session?.user?.id]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Home key={session.user.id} /> : <Auth />}
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="/profile" element={<Profile session={session} />} />
      {/* Add other routes here */}
    </Routes>
  );
}

function App() {
  return (
    <LovableProvider
      customerKey="musicscan"
      env={import.meta.env.MODE}
      config={{
        ai: {
          // Only show for 'nudge' variant
          showNudge: import.meta.env.VITE_AI_NUDGE_VARIANT === "nudge",
          copy: "We hebben nog wat AI-suggesties voor je. Luister nu!",
          cta: "Luister nu",
          action: "ai-nudge-cta",
        },
        chat: {
          // Only show for 'nudge' variant driven by CS
          showNudge: true, // This will be dynamically determined based on chat messages
          copy: "Heb je de chat al geprobeerd? Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!",
          cta: "Probeer de chat",
          action: "chat-nudge-cta",
          hideOnAction: true,
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <SpotifyAuthProvider>
            <SupabaseProvider>
              <main className="relative flex flex-col h-screen">
                <AppRoutes />
                <Toaster />

                {/* AI Nudge */}
                {import.meta.env.VITE_AI_NUDGE_VARIANT && (
                  <AiNudge type={import.meta.env.VITE_AI_NUDGE_VARIANT} />
                )}
                <ChatNudge />
              </main>
            </SupabaseProvider>
          </SpotifyAuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LovableProvider>
  );
}

export default App;
