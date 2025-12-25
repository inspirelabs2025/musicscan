import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    console.log(`[admin-queue-cleanup] Action: ${action}`);

    const results: Record<string, any> = {};

    if (action === 'reset_failed_artist_stories' || action === 'all') {
      // Reset failed artist story items back to pending
      const { data, error } = await supabase
        .from('batch_queue_items')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('item_type', 'artist_story')
        .eq('status', 'failed')
        .select('id');

      results.artist_stories_reset = {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
      };
      console.log(`[admin-queue-cleanup] Reset ${data?.length || 0} failed artist stories`);
    }

    if (action === 'remove_duplicate_artist_stories' || action === 'all') {
      // Remove queue items for artists that already have stories
      const { data: existingArtists } = await supabase
        .from('artist_stories')
        .select('artist_name');

      const existingNames = new Set((existingArtists || []).map(a => a.artist_name.toLowerCase()));

      // Get pending items and check against existing
      const { data: queueItems } = await supabase
        .from('batch_queue_items')
        .select('id, metadata')
        .eq('item_type', 'artist_story')
        .in('status', ['pending', 'failed']);

      const duplicateIds: string[] = [];
      for (const item of queueItems || []) {
        const artistName = (item.metadata as any)?.artist_name?.toLowerCase();
        if (artistName && existingNames.has(artistName)) {
          duplicateIds.push(item.id);
        }
      }

      if (duplicateIds.length > 0) {
        const { error } = await supabase
          .from('batch_queue_items')
          .delete()
          .in('id', duplicateIds);

        results.duplicates_removed = {
          success: !error,
          count: duplicateIds.length,
          error: error?.message,
        };
      } else {
        results.duplicates_removed = { success: true, count: 0 };
      }
      console.log(`[admin-queue-cleanup] Removed ${duplicateIds.length} duplicate artist story items`);
    }

    if (action === 'reset_failed_singles' || action === 'all') {
      const { data, error } = await supabase
        .from('singles_import_queue')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'failed')
        .select('id');

      results.singles_reset = {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
      };
      console.log(`[admin-queue-cleanup] Reset ${data?.length || 0} failed singles`);
    }

    if (action === 'reset_failed_albums' || action === 'all') {
      const { data, error } = await supabase
        .from('master_albums')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'failed')
        .select('id');

      results.albums_reset = {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
      };
      console.log(`[admin-queue-cleanup] Reset ${data?.length || 0} failed albums`);
    }

    // Get current queue stats
    const [artistStoryStats, singlesStats, albumStats] = await Promise.all([
      supabase
        .from('batch_queue_items')
        .select('status', { count: 'exact', head: true })
        .eq('item_type', 'artist_story')
        .eq('status', 'pending'),
      supabase
        .from('singles_import_queue')
        .select('status', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('master_albums')
        .select('status', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    results.current_stats = {
      pending_artist_stories: artistStoryStats.count || 0,
      pending_singles: singlesStats.count || 0,
      pending_albums: albumStats.count || 0,
    };

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-queue-cleanup] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
