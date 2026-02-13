import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface DiscogsConnection {
  discogs_username: string | null;
  discogs_user_id: number | null;
  connected_at: string;
}

export const useDiscogsConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["discogs-connection", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("discogs_user_tokens" as any)
        .select("discogs_username, discogs_user_id, connected_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as DiscogsConnection | null;
    },
    enabled: !!user?.id,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const callbackUrl = `${window.location.origin}/mijn-collectie?discogs=callback`;

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-oauth-start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ callback_url: callbackUrl }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "OAuth start mislukt");
      }

      const { authorize_url } = await res.json();
      // Open Discogs in a new tab (preview iframe blocks same-window redirects)
      window.open(authorize_url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Koppeling mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const callbackMutation = useMutation({
    mutationFn: async ({ oauth_token, oauth_verifier }: { oauth_token: string; oauth_verifier: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-oauth-callback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ oauth_token, oauth_verifier }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "OAuth callback mislukt");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["discogs-connection"] });
      toast({
        title: "Discogs gekoppeld!",
        description: `Verbonden als ${data.discogs_username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Koppeling mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("discogs_user_tokens" as any)
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discogs-connection"] });
      toast({
        title: "Discogs ontkoppeld",
        description: "Je Discogs account is losgekoppeld.",
      });
    },
  });

  return {
    connection,
    isLoading,
    isConnected: !!connection,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    handleCallback: callbackMutation.mutate,
    isHandlingCallback: callbackMutation.isPending,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
};
