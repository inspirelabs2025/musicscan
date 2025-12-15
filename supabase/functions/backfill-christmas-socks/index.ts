import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 20 Iconic Christmas songs for socks
const ICONIC_CHRISTMAS_SONGS = [
  { artist: 'Wham!', title: 'Last Christmas' },
  { artist: 'Mariah Carey', title: "All I Want for Christmas Is You" },
  { artist: 'Michael Bublé', title: "It's Beginning to Look a Lot like Christmas" },
  { artist: 'Band Aid', title: 'Do They Know It\'s Christmas?' },
  { artist: 'Bing Crosby', title: 'White Christmas' },
  { artist: 'Bobby Helms', title: 'Jingle Bell Rock' },
  { artist: 'Brenda Lee', title: "Rockin' Around the Christmas Tree" },
  { artist: 'Frank Sinatra', title: 'Have Yourself a Merry Little Christmas' },
  { artist: 'Dean Martin', title: 'Let It Snow! Let It Snow! Let It Snow!' },
  { artist: 'Nat King Cole', title: 'The Christmas Song' },
  { artist: 'Elvis Presley', title: 'Blue Christmas' },
  { artist: 'Andy Williams', title: 'It\'s the Most Wonderful Time of the Year' },
  { artist: 'José Feliciano', title: 'Feliz Navidad' },
  { artist: 'Chris Rea', title: 'Driving Home for Christmas' },
  { artist: 'Shakin\' Stevens', title: 'Merry Christmas Everyone' },
  { artist: 'Slade', title: 'Merry Xmas Everybody' },
  { artist: 'The Pogues', title: 'Fairytale of New York' },
  { artist: 'Ariana Grande', title: 'Santa Tell Me' },
  { artist: 'Kelly Clarkson', title: 'Underneath the Tree' },
  { artist: 'John Lennon', title: 'Happy Xmas (War Is Over)' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧦 Starting Christmas socks backfill for 20 iconic songs...');

    // Find music_stories that match our iconic songs and have artwork
    const { data: allStories, error: storiesError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, artwork_url, yaml_frontmatter')
      .not('artwork_url', 'is', null);

    if (storiesError) throw storiesError;

    // Filter to find matching iconic songs
    const matchingStories = allStories?.filter(story => {
      const isChristmas = story.yaml_frontmatter?.is_christmas === true;
      if (!isChristmas) return false;
      
      return ICONIC_CHRISTMAS_SONGS.some(iconic => 
        story.artist?.toLowerCase().includes(iconic.artist.toLowerCase()) ||
        iconic.artist.toLowerCase().includes(story.artist?.toLowerCase() || '')
      );
    }) || [];

    console.log(`📋 Found ${matchingStories.length} matching iconic Christmas songs`);

    // Check which songs already have socks
    const { data: existingSocks } = await supabase
      .from('album_socks')
      .select('artist_name, album_title');

    const existingSocksSet = new Set(
      existingSocks?.map(s => `${s.artist_name?.toLowerCase()}-${s.album_title?.toLowerCase()}`) || []
    );

    // Filter out songs that already have socks
    const songsNeedingSocks = matchingStories.filter(story => {
      const key = `${story.artist?.toLowerCase()}-${story.single_name?.toLowerCase()}`;
      return !existingSocksSet.has(key);
    });

    console.log(`🎯 ${songsNeedingSocks.length} songs need socks creation`);

    if (songsNeedingSocks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All iconic Christmas socks already exist',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process one song at a time (cron will call this repeatedly)
    const song = songsNeedingSocks[0];
    console.log(`🧦 Creating socks for: ${song.artist} - ${song.single_name}`);

    // Step 1: Apply Pop Art Posterize style to the artwork
    console.log('🎨 Applying Pop Art Posterize style...');
    
    const stylizeResponse = await supabase.functions.invoke('stylize-photo', {
      body: {
        imageUrl: song.artwork_url,
        style: 'posterize',
        outputPath: `socks/christmas-${Date.now()}.png`
      }
    });

    if (stylizeResponse.error) {
      console.error('❌ Stylize error:', stylizeResponse.error);
      throw new Error(`Failed to stylize image: ${stylizeResponse.error.message}`);
    }

    const styledImageUrl = stylizeResponse.data?.url || stylizeResponse.data?.styledUrl;
    console.log('✅ Styled image created:', styledImageUrl);

    // Step 2: Create album_socks record
    const sockSlug = `${song.artist}-${song.single_name}-socks`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);

    const { data: sockRecord, error: sockError } = await supabase
      .from('album_socks')
      .insert({
        artist_name: song.artist,
        album_title: song.single_name,
        album_cover_url: song.artwork_url,
        base_design_url: styledImageUrl,
        primary_color: '#FF0000', // Christmas red
        secondary_color: '#00FF00', // Christmas green
        accent_color: '#FFD700', // Gold
        design_theme: 'Pop Art Christmas',
        pattern_type: 'posterize',
        genre: 'Christmas',
        slug: sockSlug,
        is_published: false
      })
      .select()
      .single();

    if (sockError) {
      console.error('❌ Sock record error:', sockError);
      throw sockError;
    }

    console.log('✅ Album sock record created:', sockRecord.id);

    // Step 3: Create sock product
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-sock-products', {
      body: {
        sockId: sockRecord.id,
        styleVariants: [{ url: styledImageUrl, style: 'posterize', label: 'Pop Art' }]
      }
    });

    if (productError) {
      console.error('❌ Product creation error:', productError);
      throw productError;
    }

    console.log('🎉 Christmas sock product created successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        processed: 1,
        remaining: songsNeedingSocks.length - 1,
        song: `${song.artist} - ${song.single_name}`,
        product_id: productResult?.product_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in Christmas socks backfill:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
