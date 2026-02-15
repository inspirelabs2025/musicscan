import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { spotify_track_id, artist, title, album, year } = await req.json();

    if (!spotify_track_id || !artist || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first
    const { data: cached } = await supabase
      .from('spotify_track_insights')
      .select('*')
      .eq('spotify_track_id', spotify_track_id)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ success: true, insights: cached.insights_data, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const startTime = Date.now();

    const prompt = `Je bent een muziekexpert. Geef uitgebreide achtergrondinformatie over dit nummer in het Nederlands.

Nummer: "${title}"
Artiest: ${artist}
${album ? `Album: ${album}` : ''}
${year ? `Jaar: ${year}` : ''}

Genereer een JSON object met EXACT deze structuur (alle velden verplicht):

{
  "summary": "Korte samenvatting van het nummer (2-3 zinnen)",
  "background": "Uitgebreide achtergrondverhaal over het nummer: ontstaan, inspiratie, opname-sessies, producers, studio. Minimaal 150 woorden.",
  "artistInfo": "Korte biografie van de artiest relevant voor dit nummer (100 woorden)",
  "musicalAnalysis": "Muzikale analyse: genre, stijl, instrumentatie, productie-technieken, tempo, toonsoort als bekend (80 woorden)",
  "culturalImpact": "Culturele impact en betekenis: hitlijsten, awards, gebruik in films/series, covers, invloed op andere artiesten (80 woorden)",
  "funFacts": ["Weetje 1", "Weetje 2", "Weetje 3"],
  "relatedTracks": ["Gerelateerd nummer 1 - Artiest", "Gerelateerd nummer 2 - Artiest", "Gerelateerd nummer 3 - Artiest"],
  "era": "Beschrijving van het muzikale tijdperk waarin dit nummer uitkwam (50 woorden)",
  "lyrics_theme": "Thematische analyse van de songtekst zonder letterlijke tekst te citeren (60 woorden)"
}

Antwoord ALLEEN met valid JSON, geen markdown.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Te veel verzoeken, probeer het later opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits ontoereikend.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';

    // Clean and parse JSON
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) throw new Error('No JSON in response');
    let jsonStr = content.substring(jsonStart, jsonEnd + 1);

    let insights;
    try {
      insights = JSON.parse(jsonStr);
    } catch {
      // Fix common issues
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      insights = JSON.parse(jsonStr);
    }

    const generationTime = Date.now() - startTime;

    // Cache in database
    await supabase.from('spotify_track_insights').upsert({
      spotify_track_id,
      artist,
      title,
      album: album || null,
      year: year || null,
      insights_data: insights,
      generation_time_ms: generationTime,
    }, { onConflict: 'spotify_track_id' });

    console.log(`✅ Track insight generated for "${title}" by ${artist} in ${generationTime}ms`);

    return new Response(JSON.stringify({ success: true, insights, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Track info error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Onbekende fout' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
