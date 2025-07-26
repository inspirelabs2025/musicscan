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

    // Generate new AI insights
    const prompt = `Genereer uitgebreide AI insights voor dit album:

Artiest: ${album.artist}
Titel: ${album.title}
Label: ${album.label}
Jaar: ${album.year}
Genre: ${album.genre}
Land: ${album.country}
Catalogusnummer: ${album.catalog_number}

Schrijf een gedetailleerd verhaal in het Nederlands dat de volgende aspecten behandelt:

1. **Historische Context**: Wat gebeurde er in de muziekwereld toen dit album uitkwam?
2. **Artistieke Betekenis**: Waarom is dit album belangrijk in de carrière van de artiest?
3. **Culturele Impact**: Hoe beïnvloedde dit album de muziekcultuur?
4. **Productie & Opname**: Interessante feiten over hoe het album tot stand kwam
5. **Muzikale Innovaties**: Wat maakte dit album uniek of invloedrijk?
6. **Collecteurswaarde**: Waarom is dit album waardevol voor verzamelaars?

Retourneer je antwoord als JSON met deze structuur:
{
  "historical_context": "...",
  "artistic_significance": "...",
  "cultural_impact": "...",
  "production_story": "...",
  "musical_innovations": "...",
  "collector_value": "...",
  "fun_facts": ["feit1", "feit2", "feit3"],
  "recommended_listening": ["track1", "track2"],
  "similar_albums": [{"artist": "...", "title": "...", "reason": "..."}]
}

Schrijf boeiend en informatief, alsof je een muziekhistoricus bent die passie heeft voor vinyl en muziek.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const insights = JSON.parse(aiResponse.choices[0].message.content);
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