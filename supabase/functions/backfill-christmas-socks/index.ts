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

    console.log('🧦🎄 ===== BACKFILL CHRISTMAS SOCKS START =====');
    console.log(`📋 Processing ${ICONIC_CHRISTMAS_SONGS.length} iconic Christmas songs`);

    // Check which songs already have socks
    const { data: existingSocks, error: socksFetchError } = await supabase
      .from('album_socks')
      .select('artist_name, album_title, pattern_type');

    if (socksFetchError) {
      console.error('❌ Error fetching existing socks:', socksFetchError);
      throw socksFetchError;
    }

    console.log(`📊 Found ${existingSocks?.length || 0} existing socks in database`);

    // Create a set of existing socks for quick lookup
    const existingSocksSet = new Set(
      existingSocks?.map(s => `${s.artist_name?.toLowerCase().trim()}-${s.album_title?.toLowerCase().trim()}`) || []
    );

    // Find which iconic songs still need socks
    const songsNeedingSocks = ICONIC_CHRISTMAS_SONGS.filter(song => {
      const key = `${song.artist.toLowerCase().trim()}-${song.title.toLowerCase().trim()}`;
      const exists = existingSocksSet.has(key);
      if (exists) {
        console.log(`⏭️ Already exists: ${song.artist} - ${song.title}`);
      }
      return !exists;
    });

    console.log(`🎯 ${songsNeedingSocks.length} iconic songs still need socks`);

    if (songsNeedingSocks.length === 0) {
      console.log('✅ All 20 iconic Christmas socks already exist!');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All 20 iconic Christmas socks already exist',
          processed: 0,
          total: ICONIC_CHRISTMAS_SONGS.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process ONE song per cron run (to avoid timeouts)
    const song = songsNeedingSocks[0];
    console.log(`\n🎵 Processing: ${song.artist} - ${song.title}`);

    // Step 1: Fetch artwork via fetch-album-artwork edge function
    console.log('🎨 Step 1: Fetching artwork...');
    
    const artworkResponse = await supabase.functions.invoke('fetch-album-artwork', {
      body: {
        artist: song.artist,
        title: song.title,
        media_type: 'single'
      }
    });

    if (artworkResponse.error) {
      console.error('❌ Artwork fetch error:', artworkResponse.error);
      throw new Error(`Failed to fetch artwork: ${artworkResponse.error.message}`);
    }

    const artworkUrl = artworkResponse.data?.artwork_url;
    const artworkSource = artworkResponse.data?.source;
    
    if (!artworkUrl) {
      console.error('❌ No artwork found for:', song.artist, '-', song.title);
      throw new Error(`No artwork found for: ${song.artist} - ${song.title}`);
    }
    
    console.log(`✅ Artwork found from ${artworkSource}: ${artworkUrl}`);

    // Step 2: Apply Pop Art Posterize style to the artwork
    console.log('🎨 Step 2: Applying Pop Art Posterize style...');
    
    const stylizeResponse = await supabase.functions.invoke('stylize-photo', {
      body: {
        imageUrl: artworkUrl,
        style: 'posterize',
        outputPath: `socks/christmas-${Date.now()}.png`
      }
    });

    if (stylizeResponse.error) {
      console.error('❌ Stylize error:', stylizeResponse.error);
      throw new Error(`Failed to stylize image: ${stylizeResponse.error.message}`);
    }

    // stylize-photo returns { stylizedImageUrl: ... }
    const styledImageUrl = stylizeResponse.data?.stylizedImageUrl;
    console.log('🖼️ Stylize response data:', JSON.stringify(stylizeResponse.data));
    
    if (!styledImageUrl) {
      console.error('❌ No styled image URL returned. Response:', JSON.stringify(stylizeResponse.data));
      throw new Error('Stylize function did not return an image URL');
    }
    
    console.log('✅ Styled image created:', styledImageUrl);

    // Step 3: Create album_socks record with pattern_type: 'christmas'
    console.log('🧦 Step 3: Creating album_socks record...');
    
    const sockSlug = `${song.artist}-${song.title}-kerst-sokken`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);

    const { data: sockRecord, error: sockError } = await supabase
      .from('album_socks')
      .insert({
        artist_name: song.artist,
        album_title: song.title,
        album_cover_url: artworkUrl,
        base_design_url: styledImageUrl,
        primary_color: '#C41E3A', // Christmas red
        secondary_color: '#228B22', // Christmas green
        accent_color: '#FFD700', // Gold
        design_theme: 'Iconic Christmas',
        pattern_type: 'christmas', // ✅ CRITICAL: Set to 'christmas' not 'posterize'
        genre: 'Christmas',
        slug: sockSlug,
        is_published: false // Will be published after product creation
      })
      .select()
      .single();

    if (sockError) {
      console.error('❌ Sock record creation error:', sockError);
      throw sockError;
    }

    console.log(`✅ Album sock record created with ID: ${sockRecord.id}`);
    console.log(`   Pattern type: ${sockRecord.pattern_type}`); // Verify it's 'christmas'

    // Step 4: Create sock product via create-sock-products
    console.log('🛍️ Step 4: Creating sock product...');
    
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-sock-products', {
      body: {
        sockId: sockRecord.id,
        styleVariants: [{ url: styledImageUrl, style: 'posterize', label: 'Pop Art Christmas' }]
      }
    });

    if (productError) {
      console.error('❌ Product creation error:', productError);
      // Don't fail completely - sock record exists, product can be created later
      console.log('⚠️ Sock record created but product creation failed. Can be retried.');
    } else {
      console.log('✅ Sock product created successfully!');
      console.log('   Product ID:', productResult?.product_id);
    }

    // Final summary
    console.log('\n🎉 ===== BACKFILL CHRISTMAS SOCKS COMPLETE =====');
    console.log(`✅ Successfully created: ${song.artist} - ${song.title}`);
    console.log(`📊 Remaining: ${songsNeedingSocks.length - 1} of ${ICONIC_CHRISTMAS_SONGS.length}`);
    console.log(`🔄 Next run will process the next song in ~2 minutes`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: 1,
        remaining: songsNeedingSocks.length - 1,
        total: ICONIC_CHRISTMAS_SONGS.length,
        song: `${song.artist} - ${song.title}`,
        sock_id: sockRecord.id,
        product_id: productResult?.product_id || null,
        pattern_type: sockRecord.pattern_type // Should be 'christmas'
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
