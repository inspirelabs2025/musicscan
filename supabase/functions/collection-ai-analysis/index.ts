
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting enhanced AI collection analysis...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch collection data
    const { data: cdItems, error: cdError } = await supabaseClient
      .from('cd_scan')
      .select('*');

    const { data: vinylItems, error: vinylError } = await supabaseClient
      .from('vinyl2_scan')
      .select('*');

    if (cdError) console.error('CD Database error:', cdError);
    if (vinylError) console.error('Vinyl Database error:', vinylError);

    const allItems = [
      ...(cdItems || []).map(item => ({ ...item, source: 'cd_scan' })),
      ...(vinylItems || []).map(item => ({ ...item, source: 'vinyl2_scan' }))
    ];

    console.log(`📊 Analyzing ${allItems.length} total items (${cdItems?.length || 0} CDs, ${vinylItems?.length || 0} vinyl)`);

    if (!allItems || allItems.length === 0) {
      console.warn('No collection items found');
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          collectionProfile: {
            summary: "Je hebt nog geen items in je collectie. Tijd om muzikale schatten te verzamelen! 🎵",
            uniqueArtists: 0,
            totalItems: 0,
            formats: { cd: 0, vinyl: 0 }
          }
        },
        stats: { totalItems: 0 },
        chartData: { genreDistribution: [], formatDistribution: [], topArtists: [] },
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare collection statistics
    const uniqueArtists = new Set(allItems.map(item => item.artist)).size;
    const uniqueLabels = new Set(allItems.map(item => item.label)).size;
    const decades = [...new Set(allItems.map(item => Math.floor((item.year || 0) / 10) * 10))].sort();
    const oldestItem = Math.min(...allItems.map(item => item.year || 9999));
    const newestItem = Math.max(...allItems.map(item => item.year || 0));
    
    // Calculate value statistics
    const itemsWithPrices = allItems.filter(item => item.calculated_advice_price);
    const totalValue = itemsWithPrices.reduce((sum, item) => sum + (item.calculated_advice_price || 0), 0);
    const avgValue = itemsWithPrices.length > 0 ? totalValue / itemsWithPrices.length : 0;
    const mostValuableItems = [...itemsWithPrices]
      .sort((a, b) => (b.calculated_advice_price || 0) - (a.calculated_advice_price || 0))
      .slice(0, 5);

    // Enhanced creative storytelling AI prompt
    const prompt = `Je bent een muziek-expert die op een leuke, interessante manier vertelt over deze collectie van ${allItems.length} items!

COLLECTIE STATISTIEKEN OM TE GEBRUIKEN:
- ${uniqueArtists} unieke artiesten
- ${uniqueLabels} verschillende platenlabels
- Tijdspanne: ${oldestItem} tot ${newestItem}
- Totale waarde: €${totalValue.toFixed(2)}
- Gemiddelde waarde per item: €${avgValue.toFixed(2)}
- Formats: ${cdItems?.length || 0} CDs en ${vinylItems?.length || 0} vinyl platen
- Populairste genres: ${[...new Set(allItems.map(item => item.genre))].slice(0, 5).join(', ')}
- Belangrijkste labels: ${[...new Set(allItems.map(item => item.label))].slice(0, 5).join(', ')}

Hier is een selectie van items uit de collectie:
${allItems.slice(0, 20).map(item => `- ${item.artist} - ${item.title} (${item.year || '?'}, ${item.label || '?'})`).join('\n')}

INSTRUCTIES:
1. Analyseer deze collectie op een interessante, feiten-gebaseerde manier.
2. Gebruik concrete voorbeelden uit de collectie.
3. Vermijd aannames over de persoon.
4. Focus op muziekgeschiedenis, culturele impact en interessante verbanden.
5. Wees enthousiast maar professioneel.
6. Gebruik emoji's spaarzaam en alleen waar het echt past.

Return ALLEEN een geldig JSON object met deze structuur:

{
  "collectionProfile": {
    "summary": "Een kort, krachtig overzicht van wat deze collectie bijzonder maakt",
    "keyHighlights": ["3-5 echte hoogtepunten uit de collectie"],
    "musicianship": "Analyse van de muzikaliteit in de collectie (instrumenten, stijlen, technieken)",
    "culturalImpact": "Hoe deze albums de muziekgeschiedenis hebben beïnvloed"
  },
  "historicalContext": {
    "timeline": "Tijdlijn van belangrijke albums/gebeurtenissen in de collectie",
    "movements": ["Belangrijke muzikale bewegingen vertegenwoordigd in de collectie"],
    "innovations": ["Technische of artistieke innovaties in deze albums"]
  },
  "artisticConnections": {
    "collaborations": ["Interessante samenwerkingen tussen artiesten"],
    "influences": ["Hoe artiesten elkaar hebben beïnvloed"],
    "producerStories": ["Verhalen over producers/studios"],
    "labelLegacy": "Geschiedenis van de belangrijkste labels"
  },
  "musicalAnalysis": {
    "genres": ["Diepgaande genre analyse"],
    "soundscapes": ["Beschrijving van klankkleuren en productie"],
    "techniques": ["Innovatieve technieken gebruikt"],
    "instruments": ["Opvallende instrumentatie"]
  },
  "collectionInsights": {
    "rarities": ["Zeldzame of speciale uitgaven"],
    "hiddenGems": ["Ondergewaardeerde klassiekers"],
    "completionSuggestions": ["Suggesties voor uitbreiding"],
    "nextDiscoveries": ["Aanbevelingen gebaseerd op de collectie"]
  },
  "marketAnalysis": {
    "valuableFinds": ["Top 5 waardevolste items met context"],
    "investmentPotential": "Analyse van waardegroei potentieel",
    "marketTrends": ["Relevante trends voor deze collectie"],
    "preservationTips": ["Tips voor waardebehoud"]
  },
  "funFacts": ["5-10 écht interessante feitjes specifiek over deze collectie"],
  "technicalDetails": {
    "formats": "Analyse van de verschillende formats",
    "pressings": "Interessante persingen of edities",
    "soundQuality": "Opmerkingen over geluidskwaliteit",
    "packaging": "Bijzondere verpakkingen of artwork"
  }
}`;

    console.log('🤖 Calling OpenAI with enhanced storytelling prompt...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een muziek-expert die diepgaande, feitelijke analyses maakt van muziekcollecties.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiAnalysis = JSON.parse(openAIData.choices[0].message.content);
    
    // Prepare chart data
    const genreDistribution = Array.from(
      allItems.reduce((acc, item) => {
        if (item.genre) {
          acc.set(item.genre, (acc.get(item.genre) || 0) + 1);
        }
        return acc;
      }, new Map())
    ).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / allItems.length) * 100)
    }));

    const formatDistribution = [
      { name: "CD", value: cdItems?.length || 0, fill: "#6B7280" },
      { name: "Vinyl", value: vinylItems?.length || 0, fill: "#9CA3AF" }
    ].filter(item => item.value > 0);

    const topArtists = Array.from(
      allItems.reduce((acc, item) => {
        if (item.artist) {
          acc.set(item.artist, (acc.get(item.artist) || 0) + 1);
        }
        return acc;
      }, new Map())
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, albums]) => ({ name, albums }));

    // Calculate decade distribution
    const decadeDistribution = decades.map(decade => {
      const items = allItems.filter(item => Math.floor((item.year || 0) / 10) * 10 === decade);
      return {
        decade: `${decade}s`,
        count: items.length,
        genres: new Set(items.map(item => item.genre)).size,
        artists: new Set(items.map(item => item.artist)).size
      };
    });

    // Calculate value distribution by genre
    const valueByGenre = Array.from(
      allItems.reduce((acc, item) => {
        if (item.genre && item.calculated_advice_price) {
          const current = acc.get(item.genre) || { count: 0, total: 0 };
          acc.set(item.genre, {
            count: current.count + 1,
            total: current.total + item.calculated_advice_price
          });
        }
        return acc;
      }, new Map())
    ).map(([genre, data]) => ({
      genre,
      count: data.count,
      totalValue: data.total,
      avgPrice: data.total / data.count
    }));

    console.log('✅ AI analysis completed successfully with enhanced storytelling');

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      stats: {
        totalItems: allItems.length,
        uniqueArtists,
        uniqueLabels,
        oldestItem,
        newestItem,
        totalValue,
        avgValue,
        itemsWithPricing: itemsWithPrices.length,
        mostValuableItems
      },
      chartData: {
        genreDistribution,
        formatDistribution,
        topArtists,
        decadeDistribution,
        valueByGenre
      },
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Collection AI analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

