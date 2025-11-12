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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Singles batch processor tick started');

    const { data: pendingSingles, error: fetchError } = await supabase
      .from('singles_import_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching pending singles:', fetchError);
      throw fetchError;
    }

    if (!pendingSingles || pendingSingles.length === 0) {
      console.log('✅ No pending singles to process');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending singles' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const single = pendingSingles[0];
    console.log(`📀 Processing single: ${single.artist} - ${single.single_name}`);

    await supabase
      .from('singles_import_queue')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', single.id);

    try {
      const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-single-story`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist: single.artist,
          single_name: single.single_name,
          album: single.album,
          year: single.year,
          label: single.label,
          catalog: single.catalog,
          genre: single.genre,
          styles: single.styles,
          discogs_id: single.discogs_id,
        })
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Story generation failed: ${generateResponse.status} - ${errorText}`);
      }

      const result = await generateResponse.json();
      console.log(`✅ Story generated: ${result.music_story_id}`);

      await supabase
        .from('singles_import_queue')
        .update({ 
          status: 'completed',
          music_story_id: result.music_story_id,
          error_message: null
        })
        .eq('id', single.id);

      return new Response(JSON.stringify({
        success: true,
        processed: single.id,
        story_id: result.music_story_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error(`❌ Error processing single ${single.id}:`, error);

      const isRetryable = error.message.includes('fetch') || 
                          error.message.includes('timeout') ||
                          error.message.includes('network');

      const currentAttempts = (single.attempts || 0) + 1;
      const maxAttempts = single.max_attempts || 3;

      if (isRetryable && currentAttempts < maxAttempts) {
        await supabase
          .from('singles_import_queue')
          .update({ 
            status: 'pending',
            attempts: currentAttempts,
            error_message: error.message
          })
          .eq('id', single.id);
        
        console.log(`🔄 Marked for retry (${currentAttempts}/${maxAttempts})`);
      } else {
        await supabase
          .from('singles_import_queue')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', single.id);
        
        console.log('❌ Marked as failed');
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Batch processor error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
