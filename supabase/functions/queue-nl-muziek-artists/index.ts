import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All Dutch artists from NL_MUZIEK_FEITEN data
const NL_MUZIEK_ARTISTS = [
  "Johnny Jordaan",
  "Willy Alberti",
  "The Cats",
  "The Motions",
  "Q65",
  "Golden Earring",
  "Rob de Nijs",
  "Shocking Blue",
  "Focus",
  "Jan Akkerman",
  "George Baker Selection",
  "Mouth & MacNeal",
  "Teach-In",
  "Boudewijn de Groot",
  "Pussycat",
  "Herman Brood",
  "Luv'",
  "Doe Maar",
  "Het Goede Doel",
  "André Hazes",
  "Frank Boeijen Groep",
  "BZN",
  "Paul Elstak",
  "Rotterdam Terror Corps",
  "Marco Borsato",
  "Urban Dance Squad",
  "Tiësto",
  "De Dijk",
  "Anouk",
  "Guus Meeuwis",
  "Within Temptation",
  "Armin van Buuren",
  "Krezip",
  "De Jeugd van Tegenwoordig",
  "Afrojack",
  "BLØF",
  "Nick & Simon",
  "Hardwell",
  "Caro Emerald",
  "Kensington",
  "Oliver Heldens",
  "Martin Garrix",
  "Davina Michelle",
  "Snelle",
  "Goldband",
  "Danny Vera",
  "Froukje",
  "S10",
  "Joost Klein",
  "Chef'Special",
  "Maan",
  "3JS"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🇳🇱 Starting Dutch music artists queue process...');
    console.log(`📝 Total Dutch artists to check: ${NL_MUZIEK_ARTISTS.length}`);

    // Get existing artist stories
    const { data: existingStories, error: storiesError } = await supabase
      .from('artist_stories')
      .select('artist_name, slug');

    if (storiesError) {
      console.error('Error fetching existing stories:', storiesError);
      throw storiesError;
    }

    const existingArtistNames = new Set(
      (existingStories || []).map(s => s.artist_name.toLowerCase())
    );

    console.log(`✅ Found ${existingArtistNames.size} existing artist stories`);

    // Find artists that need stories
    const artistsNeedingStories = NL_MUZIEK_ARTISTS.filter(
      artist => !existingArtistNames.has(artist.toLowerCase())
    );

    console.log(`🎯 Artists needing stories: ${artistsNeedingStories.length}`);

    if (artistsNeedingStories.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All Dutch music artists already have stories!',
        totalArtists: NL_MUZIEK_ARTISTS.length,
        existingStories: existingArtistNames.size,
        newlyQueued: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for existing active batch
    const { data: existingBatch } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'nl_artist_story_generation')
      .in('status', ['pending', 'running'])
      .single();

    if (existingBatch) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A Dutch artist batch is already running',
        batchId: existingBatch.id,
        status: existingBatch.status
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new batch
    const { data: newBatch, error: batchError } = await supabase
      .from('batch_processing_status')
      .insert({
        process_type: 'artist_story_generation',
        status: 'pending',
        total_items: artistsNeedingStories.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      throw batchError;
    }

    console.log(`📦 Created batch: ${newBatch.id}`);

    // Create queue items for each artist - generate UUID for item_id
    const queueItems = artistsNeedingStories.map((artist, index) => ({
      batch_id: newBatch.id,
      item_id: crypto.randomUUID(), // Generate proper UUID
      item_type: 'artist_story',
      status: 'pending',
      priority: index + 1,
      metadata: {
        artist_name: artist,
        source: 'nl_muziek_feiten',
        is_dutch: true
      }
    }));

    const { error: insertError } = await supabase
      .from('batch_queue_items')
      .insert(queueItems);

    if (insertError) {
      console.error('Error inserting queue items:', insertError);
      throw insertError;
    }

    // Update batch status to running
    await supabase
      .from('batch_processing_status')
      .update({ status: 'running' })
      .eq('id', newBatch.id);

    console.log(`✅ Queued ${artistsNeedingStories.length} Dutch artists for story generation`);

    // Log the artists that were queued
    console.log('🎵 Artists queued:', artistsNeedingStories.slice(0, 10).join(', ') + 
      (artistsNeedingStories.length > 10 ? `... and ${artistsNeedingStories.length - 10} more` : ''));

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully queued ${artistsNeedingStories.length} Dutch music artists for story generation`,
      batchId: newBatch.id,
      totalArtists: NL_MUZIEK_ARTISTS.length,
      existingStories: existingArtistNames.size,
      newlyQueued: artistsNeedingStories.length,
      queuedArtists: artistsNeedingStories
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in queue-nl-muziek-artists:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
