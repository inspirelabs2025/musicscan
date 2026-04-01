import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Toaster, toast } from "@/components/ui/sonner";

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    getUserId();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUserId(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUserId(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId) {
      const checkChatMessages = async () => {
        const { count, error } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact" })
          .eq("user_id", userId);

        if (error) {
          console.error("Error checking chat messages:", error);
          return;
        }

        if (count === 0) {
          toast("💬 Heb je de chat al geprobeerd?", {
            description: "Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!",
            action: {
              label: "Probeer nu!",
              onClick: () => {
                // Logic to navigate to chat or open chat widget
                console.log("User clicked to try chat!");
                // You might dispatch an event, navigate, or open a specific chat UI element
                // For example, if there's a global chat opener function:
                // window.openChatWidget();
              },
            },
            // Optionally, add a unique ID to prevent showing this toast too often
            id: "chat-nudge-0-messages",
            duration: 10000,
          });
        }
      };

      checkChatMessages();
    }
  }, [userId]);

  return (
    <div>
      {/* Your existing App content goes here */}
      <Toaster />
    </div>
  );
}

export default App;
