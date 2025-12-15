import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 20 Iconic Christmas artists with their signature songs
const ICONIC_CHRISTMAS_ARTISTS = [
  { artist: 'Mariah Carey', song: "All I Want for Christmas Is You" },
  { artist: 'Wham!', song: 'Last Christmas' },
  { artist: 'Michael Bublé', song: "It's Beginning to Look a Lot like Christmas" },
  { artist: 'Elvis Presley', song: 'Blue Christmas' },
  { artist: 'John Lennon', song: 'Happy Xmas (War Is Over)' },
  { artist: 'Bing Crosby', song: 'White Christmas' },
  { artist: 'Nat King Cole', song: 'The Christmas Song' },
  { artist: 'Frank Sinatra', song: 'Have Yourself a Merry Little Christmas' },
  { artist: 'Dean Martin', song: 'Let It Snow! Let It Snow! Let It Snow!' },
  { artist: 'Ariana Grande', song: 'Santa Tell Me' },
  { artist: 'Brenda Lee', song: "Rockin' Around the Christmas Tree" },
  { artist: 'Bobby Helms', song: 'Jingle Bell Rock' },
  { artist: 'Band Aid', song: "Do They Know It's Christmas?" },
  { artist: 'Chris Rea', song: 'Driving Home for Christmas' },
  { artist: "Shakin' Stevens", song: 'Merry Christmas Everyone' },
  { artist: 'Slade', song: 'Merry Xmas Everybody' },
  { artist: 'Wizzard', song: 'I Wish It Could Be Christmas Everyday' },
  { artist: 'Paul McCartney', song: 'Wonderful Christmastime' },
  { artist: 'Andy Williams', song: "It's the Most Wonderful Time of the Year" },
  { artist: 'José Feliciano', song: 'Feliz Navidad' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧦🎄 ===== BACKFILL CHRISTMAS ARTIST SOCKS START =====');
    console.log(`📋 Processing ${ICONIC_CHRISTMAS_ARTISTS.length} iconic Christmas artists`);

    // Check which artists already have Christmas socks
    const { data: existingSocks, error: socksFetchError } = await supabase
      .from('album_socks')
      .select('artist_name, album_title, pattern_type')
      .eq('pattern_type', 'christmas');

    if (socksFetchError) {
      console.error('❌ Error fetching existing socks:', socksFetchError);
      throw socksFetchError;
    }

    console.log(`📊 Found ${existingSocks?.length || 0} existing Christmas socks in database`);

    // Create a set of existing socks for quick lookup
    const existingSocksSet = new Set(
      existingSocks?.map(s => `${s.artist_name?.toLowerCase().trim()}-${s.album_title?.toLowerCase().trim()}`) || []
    );

    // Find which artists still need socks
    const artistsNeedingSocks = ICONIC_CHRISTMAS_ARTISTS.filter(item => {
      const key = `${item.artist.toLowerCase().trim()}-${item.song.toLowerCase().trim()}`;
      const exists = existingSocksSet.has(key);
      if (exists) {
        console.log(`⏭️ Already exists: ${item.artist} - ${item.song}`);
      }
      return !exists;
    });

    console.log(`🎯 ${artistsNeedingSocks.length} artists still need Christmas socks`);

    if (artistsNeedingSocks.length === 0) {
      console.log('✅ All 20 iconic Christmas artist socks already exist!');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All 20 iconic Christmas artist socks already exist',
          processed: 0,
          total: ICONIC_CHRISTMAS_ARTISTS.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process ONE artist per cron run (to avoid timeouts)
    const item = artistsNeedingSocks[0];
    console.log(`\n🎵 Processing: ${item.artist} - ${item.song}`);

    // Step 1: Fetch artist artwork via fetch-artist-artwork edge function
    console.log('🎨 Step 1: Fetching artist artwork...');
    
    let artistImageUrl: string | null = null;
    
    const artworkResponse = await supabase.functions.invoke('fetch-artist-artwork', {
      body: { artistName: item.artist }
    });

    if (artworkResponse.error) {
      console.warn('⚠️ Artist artwork fetch error (continuing without image):', artworkResponse.error);
    } else {
      artistImageUrl = artworkResponse.data?.artwork_url;
      console.log(`✅ Artist artwork found: ${artistImageUrl?.substring(0, 60)}...`);
    }

    // Step 2: Generate artist Christmas sock via new edge function
    console.log('🧦 Step 2: Generating artist Christmas sock design...');
    
    const { data: sockData, error: sockGenError } = await supabase.functions.invoke('generate-artist-christmas-sock', {
      body: {
        artistName: item.artist,
        songTitle: item.song,
        artistImageUrl: artistImageUrl
      }
    });

    if (sockGenError || !sockData?.sock_id) {
      console.error('❌ Sock generation error:', sockGenError || 'No sock_id returned');
      throw new Error(`Failed to generate sock: ${sockGenError?.message || 'No sock_id'}`);
    }

    const sockId = sockData.sock_id;
    const baseDesignUrl = sockData.base_design_url;
    
    console.log(`✅ Artist sock generated with ID: ${sockId}`);
    console.log(`   base_design_url: ${baseDesignUrl?.substring(0, 80)}...`);

    // Step 3: Create sock product via create-sock-products
    console.log('🛍️ Step 3: Creating sock product...');
    
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-sock-products', {
      body: {
        sockId: sockId,
        styleVariants: [{ url: baseDesignUrl, style: 'posterize', label: 'Pop Art Christmas' }]
      }
    });

    if (productError) {
      console.error('❌ Product creation error:', productError);
      console.log('⚠️ Sock record created but product creation failed. Can be retried.');
    } else {
      console.log('✅ Sock product created successfully!');
      console.log('   Product ID:', productResult?.product_id);
    }

    // Final summary
    console.log('\n🎉 ===== BACKFILL CHRISTMAS ARTIST SOCKS COMPLETE =====');
    console.log(`✅ Successfully created: ${item.artist} - ${item.song}`);
    console.log(`📊 Remaining: ${artistsNeedingSocks.length - 1} of ${ICONIC_CHRISTMAS_ARTISTS.length}`);
    console.log(`🔄 Next run will process the next artist in ~2 minutes`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: 1,
        remaining: artistsNeedingSocks.length - 1,
        total: ICONIC_CHRISTMAS_ARTISTS.length,
        artist: item.artist,
        song: item.song,
        sock_id: sockId,
        product_id: productResult?.product_id || null,
        pattern_type: 'christmas'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in Christmas artist socks backfill:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
