import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Top2000Entry {
  position: number;
  artist: string;
  title: string;
  release_year?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { edition_year, start_position = 1, end_position = 100 } = await req.json();

    if (!edition_year || edition_year < 1999 || edition_year > 2025) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldig editiejaar (1999-2025)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'PERPLEXITY_API_KEY niet geconfigureerd' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎵 Scraping Top 2000 ${edition_year} posities ${start_position}-${end_position}...`);

    // Query Perplexity for Top 2000 data
    const prompt = `Geef me de Top 2000 lijst van NPO Radio 2 uit ${edition_year}, specifiek positie ${start_position} tot en met ${end_position}.

Voor elke positie heb ik nodig:
- position: het rangnummer (${start_position}-${end_position})
- artist: de artiestnaam
- title: de songtitel
- release_year: het jaar dat het nummer uitkwam

Geef ALLEEN een JSON array terug, zonder uitleg. Voorbeeld formaat:
[{"position":1,"artist":"Queen","title":"Bohemian Rhapsody","release_year":1975}]

Belangrijk: Gebruik de officiële NPO Radio 2 Top 2000 data van ${edition_year}. Geef precies ${end_position - start_position + 1} entries.`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een muziekdata-expert. Geef ALLEEN valide JSON arrays terug, zonder markdown formatting of uitleg. De Top 2000 is een jaarlijkse radiolijst van NPO Radio 2 in Nederland.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Low temperature for factual data
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Perplexity API fout: ${perplexityResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    const responseText = perplexityData.choices?.[0]?.message?.content || '';
    
    console.log('Perplexity raw response length:', responseText.length);

    // Parse JSON from response (handle markdown code blocks)
    let entries: Top2000Entry[] = [];
    try {
      // Remove markdown code blocks if present
      let jsonText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON array in response
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        entries = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Geen JSON array gevonden in response');
      }
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw response:', responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Kon Perplexity response niet parsen',
          raw_response: responseText.substring(0, 1000)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and clean entries
    const validEntries = entries
      .filter((e: any) => e.position && e.artist && e.title)
      .map((e: any) => ({
        position: parseInt(e.position, 10),
        artist: String(e.artist).trim(),
        title: String(e.title).trim(),
        release_year: e.release_year ? parseInt(e.release_year, 10) : undefined,
      }));

    console.log(`✅ Scraped ${validEntries.length} valid entries for Top 2000 ${edition_year}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        entries: validEntries,
        edition_year,
        range: { start: start_position, end: end_position },
        count: validEntries.length,
        citations: perplexityData.citations || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
