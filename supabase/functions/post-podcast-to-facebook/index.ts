import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  artwork_url: string | null;
  podcast_id: string;
  episode_number: number | null;
  season_number: number | null;
}

interface Podcast {
  id: string;
  name: string;
  description: string;
  artwork_url: string | null;
  author_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { queueItemId } = await req.json();

    console.log(`Processing podcast Facebook queue item: ${queueItemId}`);

    // Get queue item with episode and podcast details
    const { data: queueItem, error: queueError } = await supabase
      .from('podcast_facebook_queue')
      .select(`
        *,
        episode:own_podcast_episodes(*),
        podcast:own_podcasts(*)
      `)
      .eq('id', queueItemId)
      .single();

    if (queueError || !queueItem) {
      throw new Error(`Queue item not found: ${queueError?.message}`);
    }

    const episode = queueItem.episode as PodcastEpisode;
    const podcast = queueItem.podcast as Podcast;

    if (!episode || !podcast) {
      throw new Error('Episode or podcast data missing');
    }

    // Get Facebook credentials
    const { data: tokenData } = await supabase
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'FACEBOOK_PAGE_ACCESS_TOKEN')
      .single();

    const { data: pageIdData } = await supabase
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'FACEBOOK_PAGE_ID')
      .single();

    const { data: appSecretData } = await supabase
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'FACEBOOK_APP_SECRET')
      .single();

    if (!tokenData?.secret_value || !pageIdData?.secret_value) {
      throw new Error('Facebook credentials not configured');
    }

    const accessToken = tokenData.secret_value;
    const pageId = pageIdData.secret_value;
    const appSecret = appSecretData?.secret_value;

    // Build post message
    const isNewEpisode = queueItem.post_type === 'new_episode';
    const intros = isNewEpisode 
      ? [
          '🎙️ NIEUWE AFLEVERING!',
          '🎧 Nieuw op MusicScan Podcasts!',
          '🆕 Vers uit de studio!',
          '📻 Nieuwe podcast aflevering online!'
        ]
      : [
          '🎙️ Gemist? Luister nu!',
          '🎧 Aanrader:',
          '📻 Nog niet geluisterd?',
          '🎵 Podcast tip:'
        ];

    const randomIntro = intros[Math.floor(Math.random() * intros.length)];
    
    const episodeInfo = episode.season_number && episode.episode_number 
      ? `S${episode.season_number}E${episode.episode_number}: ` 
      : '';

    const podcastUrl = `https://musicscan.nl/de-plaat-en-het-verhaal`;
    
    const message = `${randomIntro}

${episodeInfo}${episode.title}

${episode.description?.substring(0, 200) || ''}${episode.description && episode.description.length > 200 ? '...' : ''}

🎙️ ${podcast.name}
${podcast.author_name ? `👤 Hosts: ${podcast.author_name}` : ''}

🔗 Luister nu: ${podcastUrl}

#MusicScan #Podcast #Muziek #${podcast.name.replace(/\s+/g, '')}`;

    // Generate appsecret_proof if available
    let proofParam = '';
    if (appSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(appSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(accessToken));
      const proof = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      proofParam = `&appsecret_proof=${proof}`;
    }

    // Post to Facebook
    const imageUrl = episode.artwork_url || podcast.artwork_url;
    let response;

    if (imageUrl) {
      // Post with image
      response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/photos?access_token=${accessToken}${proofParam}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: message,
          }),
        }
      );
    } else {
      // Text only post
      response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed?access_token=${accessToken}${proofParam}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }
      );
    }

    const result = await response.json();

    if (result.error) {
      console.error('Facebook API error:', result.error);
      
      await supabase
        .from('podcast_facebook_queue')
        .update({
          status: 'failed',
          error_message: result.error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueItemId);

      throw new Error(result.error.message);
    }

    // Update queue item as posted
    await supabase
      .from('podcast_facebook_queue')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        facebook_post_id: result.id || result.post_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    // Update rotation tracker
    await supabase
      .from('podcast_rotation_tracker')
      .upsert({
        episode_id: episode.id,
        times_posted: 1,
        last_posted_at: new Date().toISOString(),
      }, {
        onConflict: 'episode_id',
      });

    // Increment times_posted for existing records
    await supabase.rpc('increment_podcast_rotation', { p_episode_id: episode.id });

    // Log to facebook_post_log
    await supabase.from('facebook_post_log').insert({
      content_type: 'podcast_episode',
      content_id: episode.id,
      facebook_post_id: result.id || result.post_id,
      post_text: message.substring(0, 500),
      status: 'success',
    });

    console.log(`Successfully posted podcast episode to Facebook: ${episode.title}`);

    return new Response(
      JSON.stringify({ success: true, facebook_post_id: result.id || result.post_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error posting podcast to Facebook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
