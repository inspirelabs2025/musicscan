import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface QueueItem {
  id: string;
  item_id: string;
  batch_id: string;
  status: string;
  metadata: {
    artist_name: string;
  };
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  attempts: number;
}

interface BatchStatus {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at: string;
  last_heartbeat: string;
}

export const useArtistStoryQueue = () => {
  const queryClient = useQueryClient();

  // Get queue items
  const { data: queueItems, isLoading: queueLoading } = useQuery({
    queryKey: ["artist-story-queue"],
    queryFn: async (): Promise<QueueItem[]> => {
      const { data, error } = await supabase
        .from("batch_queue_items")
        .select("*")
        .eq("item_type", "artist_story")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get batch status
  const { data: batchStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["artist-story-batch-status"],
    queryFn: async (): Promise<BatchStatus | null> => {
      const { data, error } = await supabase
        .from("batch_processing_status")
        .select("*")
        .eq("process_type", "artist_story_generation")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Get queue stats
  const { data: stats } = useQuery({
    queryKey: ["artist-story-stats"],
    queryFn: async () => {
      const [pending, processing, completed, failed] = await Promise.all([
        supabase
          .from("batch_queue_items")
          .select("*", { count: "exact", head: true })
          .eq("item_type", "artist_story")
          .eq("status", "pending"),
        supabase
          .from("batch_queue_items")
          .select("*", { count: "exact", head: true })
          .eq("item_type", "artist_story")
          .eq("status", "processing"),
        supabase
          .from("batch_queue_items")
          .select("*", { count: "exact", head: true })
          .eq("item_type", "artist_story")
          .eq("status", "completed"),
        supabase
          .from("batch_queue_items")
          .select("*", { count: "exact", head: true })
          .eq("item_type", "artist_story")
          .eq("status", "failed"),
      ]);

      return {
        pending: pending.count || 0,
        processing: processing.count || 0,
        completed: completed.count || 0,
        failed: failed.count || 0,
      };
    },
    refetchInterval: 10000,
  });

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("artist-story-queue-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "batch_queue_items",
          filter: "item_type=eq.artist_story",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["artist-story-queue"] });
          queryClient.invalidateQueries({ queryKey: ["artist-story-stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "batch_processing_status",
          filter: "process_type=eq.artist_story_generation",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["artist-story-batch-status"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    queueItems,
    batchStatus,
    stats,
    isLoading: queueLoading || statusLoading,
  };
};
