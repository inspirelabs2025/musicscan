import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting AI-powered curated artists generation...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { count = 200 } = await req.json().catch(() => ({ count: 200 }));

    // Fetch existing curated artists
    console.log('📊 Fetching existing curated artists...');
    const { data: existingArtists, error: fetchError } = await supabaseClient
      .from('curated_artists')
      .select('artist_name, priority, releases_found_count')
      .order('releases_found_count', { ascending: false })
      .limit(100);

    if (fetchError) throw fetchError;

    // Group artists by popularity/success
    const highPriority = existingArtists?.filter(a => (a.releases_found_count || 0) > 10) || [];
    const mediumPriority = existingArtists?.filter(a => (a.releases_found_count || 0) > 3 && (a.releases_found_count || 0) <= 10) || [];
    const allArtistNames = existingArtists?.map(a => a.artist_name) || [];

    console.log(`Found ${allArtistNames.length} existing artists (${highPriority.length} high priority)`);

    const prompt = `Je bent een muziek expert gespecialiseerd in CULT HEROES, HIDDEN GEMS en UNDERGROUND LEGENDS voor een vinyl/LP catalogus.

CRUCIALE INSTRUCTIE: De volgende ${allArtistNames.length} artiesten staan AL in onze database en mogen ABSOLUUT NIET herhaald worden:
${allArtistNames.join(', ')}

SUCCESVOLLE VOORBEELDEN in onze catalogus:
${highPriority.slice(0, 20).map(a => `${a.artist_name}`).join(', ')}

TAAK: Genereer precies ${count} TOTAAL NIEUWE artiesten die:
1. NIET in de bestaande lijst voorkomen (controleer elke naam!)
2. CULT HEROES: Artiesten met een toegewijde fanbase maar geen mainstream succes
3. HIDDEN GEMS: Vergeten talenten met meerdere albums die herontdekt moeten worden
4. UNDERGROUND LEGENDS: Invloedrijke artiesten binnen hun niche die veel releases hebben
5. Minimaal 5+ albums/releases hebben uitgebracht

PRIMAIRE FOCUS - POP/ROCK/SOUL/R&B/RAP:
- Vergeten Soul & R&B zangers/zangeressen uit de jaren 60-80
- One-hit wonders met uitgebreide catalogi
- Underground hip-hop artiesten met klassieke albums
- Indie rock bands met cult status
- Singer-songwriters die kritisch succesvol waren maar commercieel flopten
- Alternatieve R&B artiesten uit de jaren 90-2000s
- Britpop/Madchester bands tweede garnituur
- Neo-soul artiesten buiten de mainstream
- Underground rap crews en producers
- Post-grunge bands die overschaduwd werden
- Garage rock revival bands
- Trip-hop artiesten buiten de grote namen

BELANGRIJKE SUBGENRES:
- Classic Soul, Northern Soul, Southern Soul
- Funk, P-Funk, Jazz-Funk
- Blues Rock, Southern Rock
- Alternative Rock, College Rock, Indie Rock
- Underground Hip-Hop, Conscious Rap, Jazz Rap
- Neo-Soul, Alternative R&B
- Britpop, Madchester, Baggy
- Post-Punk, New Wave
- Garage Rock, Psych Rock
- Trip-Hop, Downtempo

Geef ALLEEN de artiestnamen, één per regel, zonder nummering of extra tekst.
Focus op CULT HEROES en HIDDEN GEMS uit de top 200 met veel releases!`;

    console.log('🤖 Requesting AI suggestions...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een deep-dive muziek expert. Focus op OBSCURE en NICHE artiesten die weinig mensen kennen. Geef alleen artiestnamen, één per regel, geen extra tekst. Controleer dat je geen namen herhaalt uit de gegeven lijst.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse artist names from response
    const suggestedArtists = aiResponse
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // Remove numbers, bullets, dashes at start
        return line.replace(/^[\d\-\*\.\)\]\s]+/, '').trim();
      })
      .filter((name: string) => {
        // Filter out empty, too short, or already existing
        return name.length > 2 && 
               !allArtistNames.some(existing => 
                 existing.toLowerCase() === name.toLowerCase()
               );
      })
      .slice(0, count); // Limit to requested count

    console.log(`✅ Generated ${suggestedArtists.length} unique new artists`);

    // Insert new artists into database
    const artistsToInsert = suggestedArtists.map((name: string) => ({
      artist_name: name,
      is_active: true,
      priority: 1,
    }));

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Insert in batches of 50 to avoid conflicts
    const batchSize = 50;
    for (let i = 0; i < artistsToInsert.length; i += batchSize) {
      const batch = artistsToInsert.slice(i, i + batchSize);
      
      const { data: insertData, error: insertError } = await supabaseClient
        .from('curated_artists')
        .insert(batch)
        .select();

      if (insertError) {
        // Check if it's duplicate error
        if (insertError.code === '23505') {
          console.warn(`Batch ${i / batchSize + 1}: Some duplicates found`);
          skippedCount += batch.length;
        } else {
          console.error(`Batch ${i / batchSize + 1} error:`, insertError);
          errorCount += batch.length;
        }
      } else {
        insertedCount += insertData?.length || 0;
      }
    }

    // Get final count
    const { count: finalTotal } = await supabaseClient
      .from('curated_artists')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Results: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount,
        total_artists: finalTotal || 0,
        sample_artists: suggestedArtists.slice(0, 10),
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error generating curated artists:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
