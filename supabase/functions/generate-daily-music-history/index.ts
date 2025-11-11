import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsRelease {
  id: number;
  title: string;
  year: number;
  thumb?: string;
  cover_image?: string;
  artists?: Array<{ name: string }>;
  labels?: Array<{ name: string; catno: string }>;
  formats?: Array<{ name: string }>;
}

interface PerplexityEvent {
  year: number;
  description: string;
  type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting daily music history generation (Hybrid Mode)...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const DISCOGS_API_TOKEN = Deno.env.get('DISCOGS_API_TOKEN');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get current date
    const now = new Date();
    const dayOfMonth = now.getDate();
    const monthOfYear = now.getMonth() + 1;
    const eventDate = now.toISOString().split('T')[0];

    // Check if we already have events for today
    const { data: existing } = await supabase
      .from('music_history_events')
      .select('id')
      .eq('event_date', eventDate)
      .maybeSingle();

    if (existing) {
      console.log('✅ Events already exist for today, skipping generation');
      return new Response(
        JSON.stringify({ success: true, message: 'Events already exist for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                        'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

    // === STEP 1: Fetch Discogs Album Releases ===
    let discogsEvents: any[] = [];
    if (DISCOGS_API_TOKEN) {
      try {
        console.log('🔍 Fetching Discogs releases...');
        const discogsUrl = `https://api.discogs.com/database/search?month=${monthOfYear}&day=${dayOfMonth}&type=release&per_page=20`;
        
        const discogsResponse = await fetch(discogsUrl, {
          headers: {
            'Authorization': `Discogs token=${DISCOGS_API_TOKEN}`,
            'User-Agent': 'MusicScanApp/1.0'
          }
        });

        if (discogsResponse.ok) {
          const discogsData = await discogsResponse.json();
          const releases = discogsData.results || [];
          
          // Filter and format top releases
          discogsEvents = releases
            .filter((r: DiscogsRelease) => r.year && r.year > 1950)
            .slice(0, 8)
            .map((r: DiscogsRelease) => ({
              discogs_id: r.id,
              year: r.year,
              title: r.title,
              artist: r.artists?.[0]?.name || 'Various Artists',
              image_url: r.cover_image || r.thumb,
              label: r.labels?.[0]?.name,
              catalog_number: r.labels?.[0]?.catno,
              format: r.formats?.[0]?.name
            }));
          
          console.log(`✅ Found ${discogsEvents.length} Discogs releases`);
        } else {
          console.warn('⚠️ Discogs API error:', discogsResponse.status);
        }
      } catch (error) {
        console.error('❌ Error fetching Discogs:', error);
      }
    }

    // === STEP 2: Fetch Perplexity Context ===
    let perplexityContext = '';
    if (PERPLEXITY_API_KEY) {
      try {
        console.log('🔍 Fetching Perplexity context...');
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a music historian. Provide factual historical events from music history.'
              },
              {
                role: 'user',
                content: `What significant music events happened on ${monthNames[monthOfYear - 1]} ${dayOfMonth} throughout history? Include album releases, births, deaths, concerts, and milestones. Focus on facts from thisdayinmusic.com and other reliable sources.`
              }
            ],
            temperature: 0.2,
            search_domain_filter: ['thisdayinmusic.com'],
            search_recency_filter: 'month',
            max_tokens: 1000
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          perplexityContext = perplexityData.choices?.[0]?.message?.content || '';
          console.log('✅ Perplexity context fetched');
        } else {
          console.warn('⚠️ Perplexity API error:', perplexityResponse.status);
        }
      } catch (error) {
        console.error('❌ Error fetching Perplexity:', error);
      }
    }

    // === STEP 3: AI Curation & Generation ===
    console.log('🤖 Calling AI for curation and generation...');

    const aiPrompt = `Je bent een expert muziekhistoricus. Je taak is om 8-12 diverse muziekgeschiedenis events te genereren voor ${dayOfMonth} ${monthNames[monthOfYear - 1]}.

**Beschikbare Discogs Album Releases:**
${discogsEvents.length > 0 ? JSON.stringify(discogsEvents, null, 2) : 'Geen Discogs data beschikbaar'}

**Historische Context (van Perplexity/thisdayinmusic.com):**
${perplexityContext || 'Geen context beschikbaar'}

**Instructies:**
1. Selecteer 3-4 belangrijkste album releases uit Discogs data (met image_url)
2. Voeg 2-3 births/deaths toe van belangrijke artiesten
3. Voeg 1-2 concerts/events toe
4. Voeg 1-2 milestones/awards toe
5. Varieer de jaren (spreiding van vroege jaren tot recent)
6. Mix genres: rock, pop, jazz, soul, electronic, etc.
7. Schrijf ALLE beschrijvingen in het Nederlands
8. Zorg dat elk event accurate, geverifieerde informatie bevat

**Output Format (JSON array):**
[
  {
    "year": 1969,
    "title": "The Beatles - Abbey Road Release",
    "description": "The Beatles brachten hun iconische album Abbey Road uit...",
    "category": "release",
    "source": "discogs",
    "image_url": "https://...",
    "artist": "The Beatles",
    "discogs_release_id": 123456,
    "metadata": {
      "label": "Apple Records",
      "catalog_number": "PCS 7088",
      "format": "Vinyl"
    }
  },
  {
    "year": 1940,
    "title": "John Lennon geboren",
    "description": "John Lennon, medeoprichter van The Beatles...",
    "category": "birth",
    "source": "perplexity"
  }
]

**Categorieën:** "release", "concert", "milestone", "birth", "death", "award", "event"
**Sources:** "discogs", "perplexity", "ai"

Geef ALLEEN de JSON array terug, geen andere tekst.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert muziekhistoricus die accurate, diverse muziekgeschiedenis events genereert in het Nederlands. Retourneer alleen valid JSON.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Onvoldoende Lovable AI credits.',
            errorType: 'INSUFFICIENT_CREDITS',
            success: false 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated by AI');
    }

    // Parse JSON
    let events;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      events = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('AI did not return valid events array');
    }

    // Sort by year
    events.sort((a: any, b: any) => a.year - b.year);

    console.log(`✅ Generated ${events.length} music history events (${discogsEvents.length} from Discogs)`);

    // Save to database
    const { data, error: dbError } = await supabase
      .from('music_history_events')
      .insert({
        event_date: eventDate,
        day_of_month: dayOfMonth,
        month_of_year: monthOfYear,
        events: events
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('💾 Events saved to database:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        event_date: eventDate,
        events_count: events.length,
        discogs_count: discogsEvents.length,
        has_perplexity: !!perplexityContext,
        events: events
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-daily-music-history:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
