import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎬 Processing TikTok video queue (server-side MP4)...');

    // Get pending items
    const { data: pendingItems, error: fetchError } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(1); // Process 1 at a time for server-side video generation

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ No pending video items to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${pendingItems.length} pending video items`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        console.log(`🎥 Marking ready for client: ${item.artist} - ${item.title}`);

        if (!item.album_cover_url) {
          throw new Error('No album cover URL available');
        }

        // Mark as ready_for_client - actual video generation happens client-side
        // This avoids CPU timeout issues with server-side video generation
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: 'ready_for_client',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        successCount++;
        console.log(`✅ Marked ready for client: ${item.artist} - ${item.title}`);

      } catch (itemError) {
        console.error(`❌ Error processing item ${item.id}:`, itemError);

        await supabase
          .from('tiktok_video_queue')
          .update({
            status: item.attempts >= 2 ? 'failed' : 'pending',
            error_message: itemError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        failedCount++;
      }

      processedCount++;
    }

    console.log(`📊 Queue processing complete: ${processedCount} processed, ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        succeeded: successCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-tiktok-video-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
