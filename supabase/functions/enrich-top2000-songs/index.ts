import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional parameters
    let batchSize = 50;
    let editionYear: number | null = null;
    
    try {
      const body = await req.json();
      if (body.batch_size) batchSize = Math.min(body.batch_size, 100);
      if (body.edition_year) editionYear = body.edition_year;
    } catch {
      // No body, use defaults
    }

    // Fetch unenriched songs
    let query = supabase
      .from('top2000_entries')
      .select('id, artist, title, release_year, genres, country')
      .is('enriched_at', null)
      .order('year', { ascending: true })
      .order('position', { ascending: true })
      .limit(batchSize);

    if (editionYear) {
      query = query.eq('year', editionYear);
    }

    const { data: songs, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching songs:', fetchError);
      throw fetchError;
    }

    if (!songs || songs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No unenriched songs found',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${songs.length} songs for enrichment`);

    // Build prompt for AI
    const songList = songs.map((s, i) => 
      `${i + 1}. ${s.artist} - ${s.title}${s.release_year ? ` (${s.release_year})` : ''}`
    ).join('\n');

    const prompt = `Analyseer deze ${songs.length} songs en geef voor ELKE song de volgende informatie in JSON format:

${songList}

Geef een JSON array met voor elke song (in dezelfde volgorde):
{
  "artist_type": "solo_man" | "solo_woman" | "duo" | "band" | "orchestra" | "group",
  "language": "dutch" | "english" | "german" | "french" | "spanish" | "other",
  "subgenre": "specifiek subgenre zoals: classic rock, nederpop, disco, soul, punk, grunge, synthpop, power ballad, etc.",
  "energy_level": "ballad" | "midtempo" | "uptempo",
  "decade": "50s" | "60s" | "70s" | "80s" | "90s" | "00s" | "10s" | "20s"
}

Regels:
- artist_type: "solo_man" voor mannelijke solisten, "solo_woman" voor vrouwelijke solisten, "duo" voor duo's, "band" voor bands met vaste bezetting, "group" voor wisselende groepen, "orchestra" voor orkesten
- language: bepaal de taal van de LYRICS, niet de nationaliteit van de artiest
- subgenre: wees specifiek, niet alleen "rock" maar "classic rock", "hard rock", "prog rock" etc.
- decade: gebaseerd op release_year of geschatte periode
- energy_level: "ballad" voor rustige nummers, "midtempo" voor gemiddeld tempo, "uptempo" voor snelle/dansbare nummers

Geef ALLEEN de JSON array terug, geen andere tekst.`;

    // Call AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Je bent een muziekexpert die songs analyseert. Geef altijd valide JSON terug.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    let enrichmentData: any[] = [];

    try {
      let content = aiResult.choices[0].message.content;
      // Clean up markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      enrichmentData = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', aiResult.choices[0].message.content);
      throw new Error('Failed to parse AI enrichment data');
    }

    if (enrichmentData.length !== songs.length) {
      console.warn(`Mismatch: got ${enrichmentData.length} enrichments for ${songs.length} songs`);
    }

    // Update songs with enrichment data
    let successCount = 0;
    let errorCount = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const enrichment = enrichmentData[i];

      if (!enrichment) {
        console.warn(`No enrichment data for song ${i}: ${song.artist} - ${song.title}`);
        errorCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('top2000_entries')
        .update({
          artist_type: enrichment.artist_type || null,
          language: enrichment.language || null,
          subgenre: enrichment.subgenre || null,
          energy_level: enrichment.energy_level || null,
          decade: enrichment.decade || null,
          enriched_at: now
        })
        .eq('id', song.id);

      if (updateError) {
        console.error(`Error updating song ${song.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Get remaining count
    const { count: remainingCount } = await supabase
      .from('top2000_entries')
      .select('*', { count: 'exact', head: true })
      .is('enriched_at', null);

    console.log(`Enrichment complete: ${successCount} succeeded, ${errorCount} failed, ${remainingCount} remaining`);

    return new Response(JSON.stringify({
      success: true,
      processed: songs.length,
      succeeded: successCount,
      failed: errorCount,
      remaining: remainingCount || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in enrich-top2000-songs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
