import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category emoji mapping
const categoryEmojis: Record<string, string> = {
  'release': '💿',
  'birth': '🎂',
  'death': '⚫',
  'award': '🏆',
  'concert': '🎤',
  'milestone': '🌟',
  'founding': '🎸',
  'chart': '📈',
  'default': '🎵'
};

interface EventData {
  year: number;
  title: string;
  description: string;
  category: string;
  artist?: string;
  image_url?: string;
  discogs_url?: string;
}

function formatFacebookPost(event: EventData, month: number, day: number): string {
  const emoji = categoryEmojis[event.category?.toLowerCase()] || categoryEmojis['default'];
  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                      'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const monthName = monthNames[month - 1];
  
  // Build the post
  let post = `📅 Wist je dat...\n\n`;
  post += `${emoji} Op ${day} ${monthName} ${event.year}: ${event.title}\n\n`;
  post += `${event.description}\n\n`;
  
  // Add hashtags
  const hashtags = ['#WistJeDat', '#MuziekGeschiedenis', '#OnThisDay'];
  
  // Add artist hashtag if available
  if (event.artist) {
    const artistHashtag = event.artist
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    if (artistHashtag) {
      hashtags.push(`#${artistHashtag}`);
    }
  }
  
  // Add category hashtag
  if (event.category) {
    const categoryMap: Record<string, string> = {
      'release': '#NieuweRelease',
      'birth': '#Verjaardag',
      'death': '#InMemoriam',
      'award': '#Award',
      'concert': '#LiveConcert',
      'milestone': '#Mijlpaal'
    };
    if (categoryMap[event.category.toLowerCase()]) {
      hashtags.push(categoryMap[event.category.toLowerCase()]);
    }
  }
  
  hashtags.push('#MusicScan');
  post += `🎵 ${hashtags.join(' ')}\n\n`;
  
  // Add link to MusicScan
  post += `👉 Ontdek meer muziekgeschiedenis op musicscan.app/muziekgeschiedenis`;
  
  return post;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕐 Checking for scheduled music history posts...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Find posts that are due (scheduled_time <= now and status = pending)
    const { data: duePosts, error: fetchError } = await supabase
      .from('music_history_facebook_queue')
      .select('*')
      .eq('event_date', todayStr)
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(1); // Process one at a time to avoid rate limits

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      throw fetchError;
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('✅ No posts due at this time');
      return new Response(JSON.stringify({
        success: true,
        message: 'No posts due',
        posted: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const post = duePosts[0];
    const eventData = post.event_data as EventData;

    console.log(`📤 Processing post: ${eventData.title?.substring(0, 50)}...`);

    // Format the Facebook post content
    const postContent = formatFacebookPost(eventData, currentMonth, currentDay);
    console.log('📝 Formatted post content:', postContent.substring(0, 100) + '...');

    // Get Facebook credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['FACEBOOK_PAGE_ACCESS_TOKEN', 'FACEBOOK_APP_SECRET', 'FACEBOOK_PAGE_ID']);

    if (secretsError || !secrets || secrets.length < 3) {
      console.error('Error fetching Facebook credentials:', secretsError);
      throw new Error('Facebook credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => { credentials[s.secret_key] = s.secret_value; });

    const pageAccessToken = credentials['FACEBOOK_PAGE_ACCESS_TOKEN'];
    const appSecret = credentials['FACEBOOK_APP_SECRET'];
    const pageId = credentials['FACEBOOK_PAGE_ID'];

    // Generate app secret proof
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pageAccessToken));
    const appsecretProof = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    let facebookPostId = null;
    let postError = null;

    // Post to Facebook
    try {
      // Determine if we should post with image or just text
      const imageUrl = eventData.image_url;
      
      let fbResponse;
      if (imageUrl) {
        // Post with photo
        console.log('📸 Posting with image:', imageUrl);
        const photoUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
        fbResponse = await fetch(photoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            message: postContent,
            access_token: pageAccessToken,
            appsecret_proof: appsecretProof
          })
        });
      } else {
        // Post text only
        console.log('📝 Posting text only');
        const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        fbResponse = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: postContent,
            access_token: pageAccessToken,
            appsecret_proof: appsecretProof
          })
        });
      }

      const fbResult = await fbResponse.json();
      
      if (fbResult.error) {
        throw new Error(fbResult.error.message || 'Facebook API error');
      }

      facebookPostId = fbResult.id || fbResult.post_id;
      console.log(`✅ Posted to Facebook: ${facebookPostId}`);

    } catch (fbError) {
      console.error('❌ Facebook posting error:', fbError);
      postError = fbError.message;
    }

    // Update queue status
    const { error: updateError } = await supabase
      .from('music_history_facebook_queue')
      .update({
        status: facebookPostId ? 'posted' : 'failed',
        posted_at: facebookPostId ? now.toISOString() : null,
        facebook_post_id: facebookPostId,
        error_message: postError,
        updated_at: now.toISOString()
      })
      .eq('id', post.id);

    if (updateError) {
      console.warn('Warning updating queue status:', updateError);
    }

    // Log to facebook_post_log
    await supabase.from('facebook_post_log').insert({
      content_type: 'music_history',
      title: eventData.title,
      content: postContent.substring(0, 500),
      image_url: eventData.image_url,
      url: 'https://www.musicscan.app/muziekgeschiedenis',
      status: facebookPostId ? 'posted' : 'failed',
      facebook_post_id: facebookPostId,
      error_message: postError,
      posted_at: facebookPostId ? now.toISOString() : null
    });

    return new Response(JSON.stringify({
      success: !!facebookPostId,
      posted: facebookPostId ? 1 : 0,
      facebook_post_id: facebookPostId,
      error: postError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error processing scheduled posts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
