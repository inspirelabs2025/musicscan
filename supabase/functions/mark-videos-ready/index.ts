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

    console.log("Mark videos ready - checking pending items...");

    // Get pending items and mark them as ready_for_client
    const { data: pendingItems, error: fetchError } = await supabase
      .from("tiktok_video_queue")
      .select("id, artist, title")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching pending items:", fetchError);
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log("No pending items to mark as ready");
      return new Response(
        JSON.stringify({ success: true, message: "No pending items", markedCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = pendingItems.map((item) => item.id);
    console.log(`Marking ${ids.length} items as ready_for_client:`, pendingItems.map(i => `${i.artist} - ${i.title}`));

    const { error: updateError, count } = await supabase
      .from("tiktok_video_queue")
      .update({ 
        status: "ready_for_client",
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

    if (updateError) {
      console.error("Error updating items:", updateError);
      throw updateError;
    }

    console.log(`Successfully marked ${count || ids.length} items as ready_for_client`);

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
