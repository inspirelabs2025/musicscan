import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for reset_id parameter to force-reset a specific item
    const body = await req.json().catch(() => ({}));
    const resetId = body.reset_id;

    if (resetId) {
      console.log(`Force resetting item: ${resetId}`);
      const { error: resetError } = await supabase
        .from("tiktok_video_queue")
        .update({ 
          status: "pending",
          attempts: 0,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", resetId);

      if (resetError) throw resetError;
      
      return new Response(
        JSON.stringify({ success: true, message: "Item reset", markedCount: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Mark videos ready - checking pending, failed (retryable), and stuck processing items...");

    // Get pending items
    const { data: pendingItems, error: fetchError } = await supabase
      .from("tiktok_video_queue")
      .select("id, artist, title, attempts, max_attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching pending items:", fetchError);
      throw fetchError;
    }

    // Also get stuck processing items (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckItems, error: stuckError } = await supabase
      .from("tiktok_video_queue")
      .select("id, artist, title")
      .eq("status", "processing")
      .lt("updated_at", fiveMinutesAgo)
      .limit(10);

    if (stuckError) {
      console.error("Error fetching stuck items:", stuckError);
    }

    // Also get failed items that can be retried (attempts < max_attempts)
    const { data: failedItems, error: failedError } = await supabase
      .from("tiktok_video_queue")
      .select("id, artist, title, attempts, max_attempts")
      .eq("status", "failed")
      .lt("attempts", 3) // retry if under max attempts
      .order("updated_at", { ascending: true })
      .limit(5);

    if (failedError) {
      console.error("Error fetching failed items:", failedError);
    }

    const allItems = [...(pendingItems || []), ...(stuckItems || []), ...(failedItems || [])];

    if (allItems.length === 0) {
      console.log("No pending, stuck, or retryable items to mark as ready");
      return new Response(
        JSON.stringify({ success: true, message: "No pending items", markedCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = allItems.map((item) => item.id);
    console.log(`Marking ${ids.length} items as pending for server-side processing:`, allItems.map(i => `${i.artist} - ${i.title}`));
    if (stuckItems?.length) {
      console.log(`Including ${stuckItems.length} stuck processing items`);
    }

    const { error: updateError, count } = await supabase
      .from("tiktok_video_queue")
      .update({ 
        status: "pending",
        attempts: 0,
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

    if (updateError) {
      console.error("Error updating items:", updateError);
      throw updateError;
    }

    console.log(`Successfully marked ${count || ids.length} items as pending for automatic processing`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        markedCount: count || ids.length,
        items: pendingItems
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mark-videos-ready:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
