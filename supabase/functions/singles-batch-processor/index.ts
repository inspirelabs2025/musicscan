import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔄 Singles batch processor tick started');

    // Check for active batch
    const { data: batchStatus } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'single_generation')
      .eq('status', 'running')
      .maybeSingle();

    if (!batchStatus) {
      console.log('📴 No active singles batch found');
      return new Response(JSON.stringify({ message: 'No active batch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Found active singles batch:', batchStatus.id);

    // Update heartbeat
    await supabase
      .from('batch_processing_status')
      .update({ 
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', batchStatus.id);

    // Get next pending single
    const { data: pendingSingles } = await supabase
      .from('singles_import_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (!pendingSingles || pendingSingles.length === 0) {
      console.log('✅ No more pending singles - marking batch as completed');
      
      await supabase
        .from('batch_processing_status')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);

      return new Response(JSON.stringify({ message: 'Batch completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nextSingle = pendingSingles[0];
    console.log(`🎵 Processing single: ${nextSingle.artist} - ${nextSingle.single_name}`);

    // Mark as processing
    await supabase
      .from('singles_import_queue')
      .update({ 
        status: 'processing',
        attempts: nextSingle.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', nextSingle.id);

    // Update batch with current item info
    await supabase
      .from('batch_processing_status')
      .update({ 
        current_items: {
          id: nextSingle.id,
          artist: nextSingle.artist,
          single_name: nextSingle.single_name,
          started_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', batchStatus.id);

    try {
      // Generate story for this single
      console.log('📝 Generating single story...');
      const { data: storyResult, error: storyError } = await supabase.functions.invoke(
        'generate-single-story',
        {
          body: {
            artist: nextSingle.artist,
            single_name: nextSingle.single_name,
            album: nextSingle.album,
            year: nextSingle.year,
            label: nextSingle.label,
            catalog: nextSingle.catalog,
            discogs_id: nextSingle.discogs_id,
            discogs_url: nextSingle.discogs_url,
            artwork_url: nextSingle.artwork_url,
            genre: nextSingle.genre,
            styles: nextSingle.styles,
            tags: nextSingle.tags,
          }
        }
      );

      if (storyError) {
        throw new Error(`Story generation failed: ${storyError.message}`);
      }

      console.log('✅ Single story generation successful');

      // Mark as completed
      await supabase
        .from('singles_import_queue')
        .update({ 
          status: 'completed',
          music_story_id: storyResult.music_story_id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', nextSingle.id);

      // Update batch counters
      await supabase
        .from('batch_processing_status')
        .update({ 
          processed_items: (batchStatus.processed_items || 0) + 1,
          successful_items: (batchStatus.successful_items || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);

    } catch (error) {
      console.error('❌ Single story generation failed:', error);

      const maxAttempts = nextSingle.max_attempts || 3;
      const newAttempts = nextSingle.attempts + 1;
      const errorMessage = error.message || String(error);
      
      // Smart retry logic
      const shouldRetry = !errorMessage.includes('INCOMPLETE_METADATA') && 
                         !errorMessage.includes('Missing required metadata') &&
                         newAttempts < maxAttempts;
      
      if (shouldRetry) {
        await supabase
          .from('singles_import_queue')
          .update({ 
            status: 'pending',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', nextSingle.id);

        console.log(`🔄 Single will retry (attempt ${newAttempts}/${maxAttempts})`);
      } else {
        await supabase
          .from('singles_import_queue')
          .update({ 
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', nextSingle.id);

        console.log(`💀 Single failed after ${maxAttempts} attempts`);
      }

      // Update batch counters
      await supabase
        .from('batch_processing_status')
        .update({ 
          processed_items: (batchStatus.processed_items || 0) + 1,
          failed_items: (batchStatus.failed_items || 0) + (!shouldRetry ? 1 : 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);
    }

    return new Response(JSON.stringify({ 
      message: 'Single processed', 
      single: `${nextSingle.artist} - ${nextSingle.single_name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Processor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
