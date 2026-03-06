import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface AIMetrics {
  ai_usage_count: number;
}

export function useAIMetrics() {
  const { user } = useAuth();

  return useQuery<AIMetrics, Error>({
    queryKey: ["ai-metrics", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("user_ai_metrics")
        .select("ai_usage_count")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no row found
        throw new Error(error.message);
      }
      
      return data || { ai_usage_count: 0 };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export async function recordAIFeatureUse(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_ai_metrics")
    .upsert(
      { user_id: userId, ai_usage_count: 1, last_used_at: new Date().toISOString() },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select(); // Select is needed with upsert for it to return actual data / error

  if (error) {
    console.error("Error recording AI feature use:", error.message);
    // Depending on the error (e.g., 'PGRST100' for not found), you might handle inserts vs updates differently.
    // Simpler approach: check for 'PGRST100' (record not found on update) and try to insert if update fails.
    if (error.code === 'PGRST100' || error.code === '23505') { // 23505 is unique violation code
      // This means the upsert couldn't find it to update, or there was a race condition.
      // Given the 'onConflict: user_id', this path should mostly be for unexpected DB issues.
      // For now, just logging.
    } else {
      throw new Error(`Failed to record AI feature use: ${error.message}`);
    }
  }
}
