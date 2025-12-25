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

    // Get next pending item from photo_batch_queue
    const { data: pendingItem, error: fetchError } = await supabase
      .from('photo_batch_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !pendingItem) {
      console.log('[photo-queue-auto-processor] No pending items');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[photo-queue-auto-processor] Processing: ${pendingItem.artist} - ${pendingItem.title}`);

    // Call photo-batch-processor with start action
    const { data: processorResult, error: processorError } = await supabase.functions.invoke(
      'photo-batch-processor',
      {
        body: {
          action: 'start',
          photoUrl: pendingItem.image_url || pendingItem.photo_url,
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

    // Update original item status to processing (the processor will handle completion)
    await supabase
      .from('photo_batch_queue')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingItem.id);

    const executionTime = Date.now() - startTime;
    console.log(`[photo-queue-auto-processor] Started processing for ${pendingItem.artist} - ${pendingItem.title}, took ${executionTime}ms`);

    // Log to cronjob_execution_log
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'photo-queue-auto-processor',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: 1,
      metadata: {
        artist: pendingItem.artist,
        title: pendingItem.title,
        batchId: processorResult?.batchId
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        artist: pendingItem.artist,
        title: pendingItem.title,
        batchId: processorResult?.batchId,
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
