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
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { albumId } = await req.json();

    console.log('Generating AI insights for album:', albumId);

    // Get album data from database
    const [cdResult, vinylResult] = await Promise.all([
      supabase.from("cd_scan").select("*").eq("id", albumId).single(),
      supabase.from("vinyl2_scan").select("*").eq("id", albumId).single()
    ]);

    const album = cdResult.data || vinylResult.data;
    
    if (!album) {
      throw new Error("Album not found");
    }

    // Check if we already have cached insights
    const cacheKey = `ai_insights_${albumId}`;
    const { data: cachedInsights } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', albumId)
      .eq('sender_type', 'ai')
      .eq('ai_model', 'gpt-4.1-2025-04-14')
      .order('created_at', { ascending: false })
      .limit(1);

    // Return cached insights if less than 24 hours old
    if (cachedInsights && cachedInsights.length > 0) {
      const cacheAge = Date.now() - new Date(cachedInsights[0].created_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
        console.log('Returning cached insights');
        return new Response(
          JSON.stringify(JSON.parse(cachedInsights[0].message)),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Cache the insights
    await supabase.from('chat_messages').insert({
      user_id: album.user_id,
      session_id: albumId,
      message: JSON.stringify(insights),
      sender_type: 'ai',
      ai_model: 'gpt-4.1-2025-04-14',
      format_type: 'json'
    });

    console.log('Generated and cached new AI insights');

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