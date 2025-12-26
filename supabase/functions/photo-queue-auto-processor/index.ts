import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[photo-queue-auto-processor] Starting...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // FIRST: Clean up stuck 'processing' items older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: stuckItems } = await supabase
      .from('photo_batch_queue')
      .select('id, artist, title')
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinutesAgo)
      .limit(10);

    if (stuckItems && stuckItems.length > 0) {
      console.log(`[photo-queue-auto-processor] Resetting ${stuckItems.length} stuck items to pending`);
      const stuckIds = stuckItems.map(item => item.id);
      await supabase
        .from('photo_batch_queue')
        .update({ 
          status: 'pending', 
          updated_at: new Date().toISOString(),
          error_message: 'Reset from stuck processing state'
        })
        .in('id', stuckIds);
    }

    // Get next pending item from photo_batch_queue
    const { data: pendingItem, error: fetchError } = await supabase
      .from('photo_batch_queue')
      .select('*')
      .eq('status', 'pending')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !pendingItem) {
      console.log('[photo-queue-auto-processor] No pending items with image_url');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items', stuckReset: stuckItems?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageUrl = pendingItem.image_url || pendingItem.photo_url;
    if (!imageUrl) {
      console.log(`[photo-queue-auto-processor] Item ${pendingItem.id} has no image URL, marking as failed`);
      await supabase
        .from('photo_batch_queue')
        .update({
          status: 'failed',
          error_message: 'No image URL available',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingItem.id);
      
      return new Response(
        JSON.stringify({ success: false, error: 'No image URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[photo-queue-auto-processor] Processing: ${pendingItem.artist} - ${pendingItem.title}`);

    // Mark as processing BEFORE calling the processor
    await supabase
      .from('photo_batch_queue')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingItem.id);

    // Call photo-batch-processor - it will update THIS item's status when complete
    const { data: processorResult, error: processorError } = await supabase.functions.invoke(
      'photo-batch-processor',
      {
        body: {
          action: 'process-existing',
          queueItemId: pendingItem.id,
          photoUrl: imageUrl,
          artist: pendingItem.artist || 'Unknown Artist',
          title: pendingItem.title || 'Unknown Album',
          description: `Album art products for ${pendingItem.artist} - ${pendingItem.title}`
        }
      }
    );

    if (processorError) {
      console.error('[photo-queue-auto-processor] Processor error:', processorError);
      
      // Mark as failed
      await supabase
        .from('photo_batch_queue')
        .update({
          status: 'failed',
          error_message: processorError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingItem.id);

      return new Response(
        JSON.stringify({ success: false, error: processorError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    console.log(`[photo-queue-auto-processor] Started processing for ${pendingItem.artist} - ${pendingItem.title}, took ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        artist: pendingItem.artist,
        title: pendingItem.title,
        queueItemId: pendingItem.id,
        stuckReset: stuckItems?.length || 0,
        executionTimeMs: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[photo-queue-auto-processor] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
