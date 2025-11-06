import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check for pending queue items older than 2 minutes (debounce window)
    const debounceMinutes = 2;
    const cutoffTime = new Date(Date.now() - debounceMinutes * 60 * 1000).toISOString();
    
    const { data: pendingItems, error: queueError } = await supabase
      .from('sitemap_regeneration_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('queued_at', cutoffTime)
      .order('queued_at', { ascending: true })
      .limit(50);

    if (queueError) throw queueError;

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending sitemap regenerations (debounce window still active)');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending work', debounce_active: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingItems.length} queued sitemap regenerations...`);

    // Mark items as processing
    const itemIds = pendingItems.map(i => i.id);
    await supabase
      .from('sitemap_regeneration_queue')
      .update({ status: 'processing' })
      .in('id', itemIds);

    // Create log entry
    const { data: logEntry } = await supabase
      .from('sitemap_regeneration_log')
      .insert({
        trigger_source: 'queue_processor',
        status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Invoke the actual sitemap generator
    const { data: genResult, error: genError } = await supabase.functions.invoke(
      'generate-static-sitemaps',
      {
        body: {
          trigger_source: 'queue_processor',
          batch_items: pendingItems.map(i => ({
            type: i.content_type,
            id: i.content_id,
            slug: i.content_slug
          }))
        }
      }
    );

    if (genError) throw genError;

    // Update log with results
    if (logEntry) {
      await supabase
        .from('sitemap_regeneration_log')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          sitemaps_updated: genResult.sitemaps_updated || [],
          health_checks: genResult.health_checks || {},
          gsc_submitted: genResult.gsc_submitted || false,
          gsc_response: genResult.gsc_response || null,
        })
        .eq('id', logEntry.id);
    }

    // Mark queue items as processed
    await supabase
      .from('sitemap_regeneration_queue')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .in('id', itemIds);

    // Cleanup old processed items (older than 7 days)
    await supabase
      .from('sitemap_regeneration_queue')
      .delete()
      .eq('status', 'processed')
      .lt('processed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        processed_items: pendingItems.length,
        sitemaps_updated: genResult.sitemaps_updated,
        gsc_submitted: genResult.gsc_submitted,
        duration_ms: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sitemap queue processor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
