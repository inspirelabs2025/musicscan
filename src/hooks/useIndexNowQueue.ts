import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  url: string;
  content_type: string;
  processed: boolean;
  created_at: string;
  processed_at: string | null;
}

interface SubmissionLog {
  id: string;
  urls: string[];
  content_type: string;
  status_code: number | null;
  response_body: string | null;
  submitted_at: string;
}

export const useIndexNowQueue = () => {
  const queryClient = useQueryClient();

  // Get pending queue items
  const { data: queueItems, isLoading: queueLoading } = useQuery({
    queryKey: ["indexnow-queue"],
    queryFn: async (): Promise<QueueItem[]> => {
      const { data, error } = await supabase
        .from("indexnow_queue")
        .select("*")
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get recent submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["indexnow-submissions"],
    queryFn: async (): Promise<SubmissionLog[]> => {
      const { data, error } = await supabase
        .from("indexnow_submissions")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual submission mutation
  const submitToIndexNow = useMutation({
    mutationFn: async (urls: string[]) => {
      const { data, error } = await supabase.functions.invoke("indexnow-submit", {
        body: { urls, contentType: "manual" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("URLs submitted to IndexNow successfully");
      queryClient.invalidateQueries({ queryKey: ["indexnow-queue"] });
      queryClient.invalidateQueries({ queryKey: ["indexnow-submissions"] });
    },
    onError: (error: Error) => {
      toast.error(`IndexNow submission failed: ${error.message}`);
    },
  });

  // Get queue stats
  const { data: stats } = useQuery({
    queryKey: ["indexnow-stats"],
    queryFn: async () => {
      const [queueCount, successCount, failureCount] = await Promise.all([
        supabase
          .from("indexnow_queue")
          .select("*", { count: "exact", head: true })
          .eq("processed", false),
        supabase
          .from("indexnow_submissions")
          .select("*", { count: "exact", head: true })
          .in("status_code", [200, 202]),
        supabase
          .from("indexnow_submissions")
          .select("*", { count: "exact", head: true })
          .not("status_code", "in", "(200,202)"),
      ]);

      return {
        pending: queueCount.count || 0,
        successful: successCount.count || 0,
        failed: failureCount.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  return {
    queueItems,
    submissions,
    stats,
    isLoading: queueLoading || submissionsLoading,
    submitToIndexNow: submitToIndexNow.mutate,
    isSubmitting: submitToIndexNow.isPending,
  };
};
