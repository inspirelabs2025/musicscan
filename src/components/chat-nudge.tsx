import { useEffect } from "react";
import { toast } from "sonner";
import { MessageSquareText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CHAT_NUDGE_KEY = "hasSeenChatNudge";

export function ChatNudge() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const hasSeenChatNudge = localStorage.getItem(CHAT_NUDGE_KEY);
    if (hasSeenChatNudge) return;

    // Show nudge for users with 0 chat messages
    const timer = setTimeout(() => {
      toast(
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Heb je de chat al geprobeerd?</p>
            <p className="text-sm text-muted-foreground">
              Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie
              om sneller antwoorden te krijgen!
            </p>
          </div>
        </div>,
        {
          id: "chat-nudge",
          duration: 10000,
          action: {
            label: "Naar chat",
            onClick: () => {
              // Trigger the floating chat by clicking its toggle button
              const chatButton = document.querySelector<HTMLButtonElement>(
                '[aria-label="Open Magic Mike Chat"]'
              );
              if (chatButton) chatButton.click();
            },
          },
          closeButton: true,
        }
      );
      localStorage.setItem(CHAT_NUDGE_KEY, "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
