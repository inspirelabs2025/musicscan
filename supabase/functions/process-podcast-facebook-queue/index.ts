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

    console.log('Processing podcast Facebook queue...');

    // Get pending items that are scheduled for now or earlier
    const { data: pendingItems, error: fetchError } = await supabase
      .from('podcast_facebook_queue')
      .select('id, episode_id, post_type')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1);

    if (fetchError) {
      throw new Error(`Error fetching queue: ${fetchError.message}`);
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending podcast posts to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const item = pendingItems[0];
    console.log(`Processing queue item: ${item.id} (${item.post_type})`);

    // Call the posting function
    const postResponse = await supabase.functions.invoke('post-podcast-to-facebook', {
      body: { queueItemId: item.id },
    });

    if (postResponse.error) {
      console.error('Error from post function:', postResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: postResponse.error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully processed podcast post');

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: 1,
        item_id: item.id,
        result: postResponse.data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing podcast queue:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
