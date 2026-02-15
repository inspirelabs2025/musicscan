import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🔄 Starting automatic Spotify sync for all connected users...');

    // Find all users with active Spotify connections
    const { data: connectedUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, spotify_display_name, spotify_last_sync')
      .eq('spotify_connected', true)
      .not('spotify_refresh_token', 'is', null);

    if (usersError) {
      console.error('Error fetching connected users:', usersError);
      throw usersError;
    }

    if (!connectedUsers || connectedUsers.length === 0) {
      console.log('ℹ️ No connected Spotify users found');
      return new Response(JSON.stringify({ message: 'No connected users', synced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Found ${connectedUsers.length} connected Spotify users`);

    const results: { user: string; success: boolean; error?: string }[] = [];

    // Sync each user sequentially (to avoid rate limits)
    for (const user of connectedUsers) {
      try {
        console.log(`🎧 Syncing: ${user.spotify_display_name || user.user_id}`);

        // Call the existing spotify-sync function
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/spotify-sync`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ user_id: user.user_id }),
          }
        );

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log(`✅ Synced ${user.spotify_display_name}: tracks=${syncData.success?.tracks || 0}, playlists=${syncData.success?.playlists || 0}`);
          results.push({ user: user.spotify_display_name || user.user_id, success: true });
        } else {
          const errText = await syncResponse.text();
          console.error(`❌ Failed for ${user.spotify_display_name}:`, errText);
          results.push({ user: user.spotify_display_name || user.user_id, success: false, error: errText.substring(0, 200) });
        }

        // Wait 2 seconds between users to avoid Spotify rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error syncing ${user.spotify_display_name}:`, error.message);
        results.push({ user: user.spotify_display_name || user.user_id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Auto-sync complete: ${successCount}/${connectedUsers.length} users synced`);

    return new Response(JSON.stringify({
      message: 'Auto-sync complete',
      total: connectedUsers.length,
      synced: successCount,
      failed: connectedUsers.length - successCount,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Auto-sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
