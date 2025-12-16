import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of film composers to process
const FILM_COMPOSERS = [
  "Hans Zimmer",
  "John Williams", 
  "Ennio Morricone",
  "Howard Shore",
  "James Horner",
  "Danny Elfman",
  "Alan Silvestri",
  "Jerry Goldsmith",
  "Bernard Herrmann",
  "Max Steiner",
  "John Barry",
  "Thomas Newman",
  "James Newton Howard",
  "Alexandre Desplat",
  "Michael Giacchino",
  "Ramin Djawadi",
  "Junkie XL",
  "Ludwig Göransson",
  "Hildur Guðnadóttir",
  "Harry Gregson-Williams",
  "Carter Burwell",
  "Clint Mansell",
  "Trent Reznor",
  "Atticus Ross",
  "Johan Johansson",
  "Dario Marianelli",
  "Alberto Iglesias",
  "Joe Hisaishi",
  "A.R. Rahman",
  "Klaus Badelt",
  "Henry Mancini",
  "Elmer Bernstein",
  "Maurice Jarre",
  "Vangelis",
  "Giorgio Moroder",
  "Basil Poledouris",
  "Randy Newman",
  "Patrick Doyle",
  "Marco Beltrami",
  "Brian Tyler"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let action = 'tick';
    try {
      const body = await req.json();
      action = body.action || 'tick';
    } catch {
      console.log('⏰ Cron job triggered - defaulting to tick action');
      action = 'tick';
    }
    
    console.log(`🎬 Composer batch processor - action: ${action}`);

    // Handle 'tick' action - process next composer
    if (action === 'tick' || action === 'process_next') {
      // Get active batch
      const { data: activeBatch, error: batchError } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'composer_story_generation')
        .eq('status', 'processing')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (batchError) {
        console.error('❌ Error fetching active batch:', batchError);
        throw batchError;
      }

      if (!activeBatch) {
        // No active batch - check if we should auto-start
        console.log('📋 No active batch - checking for composers without stories...');
        
        // Get existing composer stories
        const { data: existingStories } = await supabase
          .from('artist_stories')
          .select('artist_name')
          .or('music_style.cs.{Film Score},music_style.cs.{Soundtrack},music_style.cs.{Orchestral}');

        const existingNames = new Set(existingStories?.map(s => s.artist_name.toLowerCase()) || []);
        const composersToProcess = FILM_COMPOSERS.filter(c => !existingNames.has(c.toLowerCase()));

        if (composersToProcess.length === 0) {
          console.log('✅ All composers have stories');
          return new Response(JSON.stringify({
            success: true,
            message: 'All composers have stories'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Auto-create batch
        console.log(`🚀 Auto-starting batch for ${composersToProcess.length} composers`);
        
        const { data: batch, error: createBatchError } = await supabase
          .from('batch_processing_status')
          .insert({
            process_type: 'composer_story_generation',
            status: 'processing',
            total_items: composersToProcess.length,
            processed_items: 0,
            successful_items: 0,
            failed_items: 0,
            started_at: new Date().toISOString(),
            last_heartbeat: new Date().toISOString()
          })
          .select()
          .single();

        if (createBatchError) throw createBatchError;

        // Create queue items
        const queueItems = composersToProcess.map(composer => ({
          batch_id: batch.id,
          item_id: crypto.randomUUID(),
          item_type: 'composer_story',
          status: 'pending',
          metadata: { composer_name: composer }
        }));

        await supabase.from('batch_queue_items').insert(queueItems);
        
        console.log(`✅ Created batch ${batch.id} with ${composersToProcess.length} composers`);
        
        // Continue to process first item
        return new Response(JSON.stringify({
          success: true,
          message: `Auto-started batch with ${composersToProcess.length} composers`,
          batch_id: batch.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get next pending item
      const { data: nextItem, error: itemError } = await supabase
        .from('batch_queue_items')
        .select('*')
        .eq('batch_id', activeBatch.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (itemError) throw itemError;

      if (!nextItem) {
        // Check if batch is complete
        const { data: queueStats } = await supabase
          .from('batch_queue_items')
          .select('status')
          .eq('batch_id', activeBatch.id);

        const pending = queueStats?.filter(s => s.status === 'pending').length || 0;
        const processing = queueStats?.filter(s => s.status === 'processing').length || 0;

        if (pending === 0 && processing === 0) {
          console.log('✅ Batch completed');
          await supabase
            .from('batch_processing_status')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', activeBatch.id);
        }

        return new Response(JSON.stringify({
          success: true,
          message: pending === 0 && processing === 0 ? 'Batch completed' : 'Waiting'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Mark as processing
      await supabase
        .from('batch_queue_items')
        .update({ status: 'processing' })
        .eq('id', nextItem.id);

      const composerName = nextItem.metadata.composer_name;
      console.log(`🎼 Processing composer: ${composerName}`);

      try {
        // Call generate-composer-story
        const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-composer-story', {
          body: { composerName, saveToDatabase: true }
        });

        if (storyError) throw storyError;

        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        await supabase
          .from('batch_processing_status')
          .update({
            processed_items: activeBatch.processed_items + 1,
            successful_items: activeBatch.successful_items + 1,
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', activeBatch.id);

        console.log(`✅ Success: ${composerName}`);

        return new Response(JSON.stringify({
          success: true,
          composer: composerName
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error: any) {
        console.error(`❌ Failed: ${composerName}`, error);

        const newAttempts = (nextItem.attempts || 0) + 1;
        const maxAttempts = 3;

        await supabase
          .from('batch_queue_items')
          .update({ 
            status: newAttempts >= maxAttempts ? 'failed' : 'pending',
            error_message: error.message,
            processed_at: new Date().toISOString(),
            attempts: newAttempts
          })
          .eq('id', nextItem.id);

        if (newAttempts >= maxAttempts) {
          await supabase
            .from('batch_processing_status')
            .update({
              processed_items: activeBatch.processed_items + 1,
              failed_items: activeBatch.failed_items + 1,
              last_heartbeat: new Date().toISOString()
            })
            .eq('id', activeBatch.id);
        }

        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'status') {
      const { data: latestBatch } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'composer_story_generation')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestBatch) {
        // Check how many composers need stories
        const { data: existingStories } = await supabase
          .from('artist_stories')
          .select('artist_name')
          .or('music_style.cs.{Film Score},music_style.cs.{Soundtrack},music_style.cs.{Orchestral}');

        const existingNames = new Set(existingStories?.map(s => s.artist_name.toLowerCase()) || []);
        const composersToProcess = FILM_COMPOSERS.filter(c => !existingNames.has(c.toLowerCase()));

        return new Response(JSON.stringify({
          success: true,
          message: 'No batch running',
          composers_pending: composersToProcess.length,
          composers_completed: FILM_COMPOSERS.length - composersToProcess.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: queueStats } = await supabase
        .from('batch_queue_items')
        .select('status')
        .eq('batch_id', latestBatch.id);

      return new Response(JSON.stringify({
        ...latestBatch,
        queue_stats: {
          pending: queueStats?.filter(s => s.status === 'pending').length || 0,
          processing: queueStats?.filter(s => s.status === 'processing').length || 0,
          completed: queueStats?.filter(s => s.status === 'completed').length || 0,
          failed: queueStats?.filter(s => s.status === 'failed').length || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in composer batch processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
