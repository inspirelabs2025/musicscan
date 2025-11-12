import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log(`🎸 Artist stories batch processor: ${action}`);

    if (action === 'start') {
      // Get all unique artists from discogs_import_log
      const { data: artists, error: artistsError } = await supabase
        .from('discogs_import_log')
        .select('artist')
        .not('artist', 'is', null)
        .neq('artist', '');

      if (artistsError) {
        throw new Error(`Failed to fetch artists: ${artistsError.message}`);
      }

      // Get unique artist names
      const uniqueArtists = [...new Set(artists.map(a => a.artist))];
      console.log(`📊 Found ${uniqueArtists.length} unique artists`);

      // Check which artists already have stories
      const { data: existingStories, error: existingError } = await supabase
        .from('artist_stories')
        .select('artist_name');

      if (existingError) {
        console.error('Error checking existing stories:', existingError);
      }

      const existingArtistNames = new Set(existingStories?.map(s => s.artist_name) || []);
      const artistsToProcess = uniqueArtists.filter(a => !existingArtistNames.has(a));

      console.log(`✅ ${artistsToProcess.length} artists need stories (${existingArtistNames.size} already exist)`);

      // Create batch processing status
      const { data: batchStatus, error: batchError } = await supabase
        .from('batch_processing_status')
        .insert({
          process_type: 'artist_stories',
          status: 'processing',
          total_items: artistsToProcess.length,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          started_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString()
        })
        .select()
        .single();

      if (batchError) {
        throw new Error(`Failed to create batch status: ${batchError.message}`);
      }

      // Create queue items for each artist
      const queueItems = artistsToProcess.map(artistName => ({
        batch_id: batchStatus.id,
        item_id: crypto.randomUUID(),
        item_type: 'artist',
        status: 'pending',
        priority: 0,
        attempts: 0,
        max_attempts: 3,
        metadata: { artist_name: artistName }
      }));

      const { error: queueError } = await supabase
        .from('batch_queue_items')
        .insert(queueItems);

      if (queueError) {
        throw new Error(`Failed to create queue items: ${queueError.message}`);
      }

      console.log(`✅ Batch started with ${artistsToProcess.length} artists in queue`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          batch_id: batchStatus.id,
          total: artistsToProcess.length,
          message: `Started processing ${artistsToProcess.length} artists`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_next') {
      // Get next pending item
      const { data: nextItem, error: nextError } = await supabase
        .from('batch_queue_items')
        .select('*')
        .eq('item_type', 'artist')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextError || !nextItem) {
        console.log('No pending artists to process');
        return new Response(
          JSON.stringify({ success: true, message: 'No pending items' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const artistName = nextItem.metadata?.artist_name;
      if (!artistName) {
        throw new Error('Artist name not found in queue item');
      }

      console.log(`🎸 Processing artist: ${artistName}`);

      // Update status to processing
      await supabase
        .from('batch_queue_items')
        .update({ 
          status: 'processing',
          attempts: nextItem.attempts + 1
        })
        .eq('id', nextItem.id);

      try {
        // Generate artist story
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-artist-story`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artistName })
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          throw new Error(`Generation failed: ${errorText}`);
        }

        const result = await generateResponse.json();

        // Mark as completed
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        // Update batch status
        const { data: currentBatch } = await supabase
          .from('batch_processing_status')
          .select('*')
          .eq('id', nextItem.batch_id)
          .single();

        if (currentBatch) {
          await supabase
            .from('batch_processing_status')
            .update({
              processed_items: currentBatch.processed_items + 1,
              successful_items: currentBatch.successful_items + 1,
              last_heartbeat: new Date().toISOString()
            })
            .eq('id', nextItem.batch_id);
        }

        console.log(`✅ Successfully processed: ${artistName}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            artist: artistName,
            story_id: result.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error(`❌ Error processing ${artistName}:`, error);

        // Check if we should retry
        const shouldRetry = nextItem.attempts < nextItem.max_attempts && 
                           (error.message.includes('429') || 
                            error.message.includes('timeout') ||
                            error.message.includes('network'));

        await supabase
          .from('batch_queue_items')
          .update({ 
            status: shouldRetry ? 'pending' : 'failed',
            error_message: error.message,
            processed_at: shouldRetry ? null : new Date().toISOString()
          })
          .eq('id', nextItem.id);

        // Update batch status for failures
        if (!shouldRetry) {
          const { data: currentBatch } = await supabase
            .from('batch_processing_status')
            .select('*')
            .eq('id', nextItem.batch_id)
            .single();

          if (currentBatch) {
            await supabase
              .from('batch_processing_status')
              .update({
                processed_items: currentBatch.processed_items + 1,
                failed_items: currentBatch.failed_items + 1,
                last_heartbeat: new Date().toISOString()
              })
              .eq('id', nextItem.batch_id);
          }
        }

        throw error;
      }
    }

    if (action === 'status') {
      // Get latest batch status
      const { data: batchStatus, error: statusError } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'artist_stories')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (statusError) {
        throw new Error(`Failed to get batch status: ${statusError.message}`);
      }

      // Get queue stats
      const { data: queueStats } = await supabase
        .from('batch_queue_items')
        .select('status')
        .eq('batch_id', batchStatus.id);

      const stats = {
        pending: queueStats?.filter(i => i.status === 'pending').length || 0,
        processing: queueStats?.filter(i => i.status === 'processing').length || 0,
        completed: queueStats?.filter(i => i.status === 'completed').length || 0,
        failed: queueStats?.filter(i => i.status === 'failed').length || 0
      };

      return new Response(
        JSON.stringify({ 
          ...batchStatus,
          queue_stats: stats
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in artist-stories-batch-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
