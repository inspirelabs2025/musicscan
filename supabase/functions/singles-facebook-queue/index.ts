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

    const { action } = await req.json();

    // ACTION: populate - Fill queue from existing singles
    if (action === 'populate') {
      console.log('📋 Populating Facebook queue from existing singles...');
      
      // Get all published singles that are not yet in the queue
      const { data: singles, error: singlesError } = await supabase
        .from('music_stories')
        .select('id, artist, single_name, slug, artwork_url')
        .not('single_name', 'is', null)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (singlesError) throw singlesError;

      if (!singles || singles.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No singles to add to queue',
          added: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Filter out singles already in queue
      const { data: existingQueue } = await supabase
        .from('singles_facebook_queue')
        .select('music_story_id');

      const existingIds = new Set((existingQueue || []).map(q => q.music_story_id));
      const newSingles = singles.filter(s => !existingIds.has(s.id));

      if (newSingles.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'All singles already in queue',
          added: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add to queue with priority 0 (low priority for existing)
      const queueItems = newSingles.map((single, index) => ({
        music_story_id: single.id,
        artist: single.artist || 'Unknown',
        single_name: single.single_name,
        slug: single.slug,
        artwork_url: single.artwork_url,
        priority: 0, // Low priority for bulk add
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('singles_facebook_queue')
        .insert(queueItems);

      if (insertError) throw insertError;

      console.log(`✅ Added ${queueItems.length} singles to Facebook queue`);

      return new Response(JSON.stringify({
        success: true,
        message: `Added ${queueItems.length} singles to queue`,
        added: queueItems.length,
        total_singles: singles.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: status - Get queue status
    if (action === 'status') {
      const { data: stats } = await supabase
        .from('singles_facebook_queue')
        .select('status');

      const statusCounts = {
        pending: 0,
        posted: 0,
        failed: 0,
        skipped: 0,
        total: stats?.length || 0
      };

      stats?.forEach((item: any) => {
        if (statusCounts.hasOwnProperty(item.status)) {
          statusCounts[item.status as keyof typeof statusCounts]++;
        }
      });

      return new Response(JSON.stringify({
        success: true,
        ...statusCounts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: clear - Clear the queue
    if (action === 'clear') {
      const { error } = await supabase
        .from('singles_facebook_queue')
        .delete()
        .eq('status', 'pending');

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Pending queue cleared'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: retry - Reset failed items
    if (action === 'retry') {
      const { error } = await supabase
        .from('singles_facebook_queue')
        .update({ status: 'pending', error_message: null })
        .eq('status', 'failed');

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Failed items reset to pending'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use: populate, status, clear, or retry');

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
