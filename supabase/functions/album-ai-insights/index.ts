import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { albumId, albumType } = await req.json();

    console.log('Generating AI insights for album:', albumId, 'type:', albumType);

    if (!albumId) {
      throw new Error("Album ID is required");
    }

    // Determine album type if not provided
    let detectedAlbumType = albumType;
    let album = null;

    if (detectedAlbumType === 'release') {
      // Get album data from releases table
      const result = await supabase.from('releases').select("*").eq("id", albumId).maybeSingle();
      album = result.data;
      // For releases, we don't have a user_id so we'll use a system user
      if (album) {
        album.user_id = '00000000-0000-0000-0000-000000000000'; // Special system user UUID for releases
      }
    } else if (detectedAlbumType) {
      // Get album data from specific table
      const tableName = detectedAlbumType === 'cd' ? 'cd_scan' : 'vinyl2_scan';
      const result = await supabase.from(tableName).select("*").eq("id", albumId).maybeSingle();
      album = result.data;
    } else {
      // Try all tables to find the album
      const [cdResult, vinylResult, releaseResult] = await Promise.all([
        supabase.from("cd_scan").select("*").eq("id", albumId).maybeSingle(),
        supabase.from("vinyl2_scan").select("*").eq("id", albumId).maybeSingle(),
        supabase.from("releases").select("*").eq("id", albumId).maybeSingle()
      ]);

      if (cdResult.data) {
        album = cdResult.data;
        detectedAlbumType = 'cd';
      } else if (vinylResult.data) {
        album = vinylResult.data;
        detectedAlbumType = 'vinyl';
      } else if (releaseResult.data) {
        album = releaseResult.data;
        album.user_id = '00000000-0000-0000-0000-000000000000'; // Special system user UUID for releases
        detectedAlbumType = 'release';
      }
    }
    
    if (!album) {
      throw new Error("Album not found");
    }

    // Check if we already have cached insights in the new table
    const { data: cachedInsights } = await supabase
      .from('album_insights')
      .select('*')
      .eq('album_id', albumId)
      .eq('album_type', detectedAlbumType)
      .eq('user_id', album.user_id)
      .maybeSingle();

    // Return cached insights if still valid (less than 7 days old)
    if (cachedInsights && cachedInsights.cached_until && new Date(cachedInsights.cached_until) > new Date()) {
      console.log('Returning cached insights from album_insights table');
      return new Response(
        JSON.stringify(cachedInsights.insights_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new structured story using the story-generator function
    const albumPrompt = `Genereer een uitgebreid verhaal over dit album:

Album: ${album.title} door ${album.artist}
Label: ${album.label || 'Onbekend'}
Jaar: ${album.year || 'Onbekend'}
Genre: ${album.genre || 'Onbekend'}
Land: ${album.country || 'Onbekend'}
Catalogusnummer: ${album.catalog_number || 'Onbekend'}

Extra context: Dit is een ${detectedAlbumType === 'cd' ? 'CD' : detectedAlbumType === 'vinyl' ? 'vinyl plaat' : 'muziekrelease'} uit de collectie van een muziekliefhebber.

Volg de verplichte structuur met alle 7 secties en zorg voor concrete, specifieke details over dit album, de artiest, en de muziekhistorische context.`;

    // Call the story-generator function
    const storyResponse = await supabase.functions.invoke('story-generator', {
      body: { prompt: albumPrompt }
    });

    if (storyResponse.error) {
      throw new Error(`Story generation error: ${storyResponse.error.message}`);
    }

    const { story } = storyResponse.data;
    
    // Create structured insights object with the markdown story
    const insights = {
      story_markdown: story,
      generation_method: 'structured_story',
      album_info: {
        artist: album.artist,
        title: album.title,
        label: album.label,
        year: album.year,
        genre: album.genre,
        country: album.country,
        catalog_number: album.catalog_number
      }
    };
    const generationTime = Date.now() - startTime;

    // Cache the insights in the new dedicated table
    const cacheUntil = new Date();
    cacheUntil.setDate(cacheUntil.getDate() + 7); // Cache for 7 days

    if (cachedInsights) {
      // Update existing insights
      await supabase
        .from('album_insights')
        .update({
          insights_data: insights,
          cached_until: cacheUntil.toISOString(),
          generation_time_ms: generationTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', cachedInsights.id);
    } else {
      // Insert new insights
      await supabase.from('album_insights').insert({
        album_id: albumId,
        album_type: detectedAlbumType,
        user_id: album.user_id,
        insights_data: insights,
        cached_until: cacheUntil.toISOString(),
        generation_time_ms: generationTime,
        ai_model: 'gpt-4.1-2025-04-14'
      });
    }

    console.log(`Generated and cached new AI insights in ${generationTime}ms`);

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in album-ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});