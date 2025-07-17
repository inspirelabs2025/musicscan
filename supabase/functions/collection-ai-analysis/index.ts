import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🤖 Starting AI collection analysis...');

    // Fetch collection data
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select('*');

    if (cdError) throw cdError;

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('*');

    if (vinylError) throw vinylError;

    // Combine and prepare data for AI analysis
    const allItems = [
      ...(cdData || []).map(item => ({ ...item, format: 'CD' })),
      ...(vinylData || []).map(item => ({ ...item, format: 'Vinyl' }))
    ];

    console.log(`📊 Analyzing ${allItems.length} items in collection`);

    // Prepare collection summary for AI
    const collectionSummary = {
      totalItems: allItems.length,
      totalCDs: cdData?.length || 0,
      totalVinyls: vinylData?.length || 0,
      genres: [...new Set(allItems.map(item => item.genre).filter(Boolean))],
      artists: [...new Set(allItems.map(item => item.artist).filter(Boolean))],
      labels: [...new Set(allItems.map(item => item.label).filter(Boolean))],
      years: allItems.map(item => item.year).filter(Boolean).sort((a, b) => a - b),
      countries: [...new Set(allItems.map(item => item.country).filter(Boolean))],
      topArtists: getTopItems(allItems, 'artist', 10),
      topGenres: getTopItems(allItems, 'genre', 10),
      topLabels: getTopItems(allItems, 'label', 8),
      priceStats: calculatePriceStats(allItems),
      vintageItems: allItems.filter(item => item.year && item.year < 1980),
      recentItems: allItems.filter(item => item.year && item.year > 2010),
      mostValuable: getMostValuable(allItems, 5)
    };

    // Create AI analysis prompt
    const analysisPrompt = `You are an expert music curator and collector analyzing a personal music collection. Based on the following collection data, provide a fascinating and insightful AI analysis.

Collection Overview:
- Total Items: ${collectionSummary.totalItems} (${collectionSummary.totalCDs} CDs, ${collectionSummary.totalVinyls} Vinyls)
- Genres: ${collectionSummary.genres.slice(0, 15).join(', ')}
- Top Artists: ${collectionSummary.topArtists.map(a => `${a.name} (${a.count})`).join(', ')}
- Year Range: ${collectionSummary.years[0]} - ${collectionSummary.years[collectionSummary.years.length - 1]}
- Top Labels: ${collectionSummary.topLabels.map(l => `${l.name} (${l.count})`).join(', ')}
- Countries: ${collectionSummary.countries.slice(0, 10).join(', ')}

Provide a comprehensive analysis in JSON format with these sections:

{
  "musicPersonality": {
    "profile": "A detailed personality analysis based on music taste (2-3 sentences)",
    "traits": ["trait1", "trait2", "trait3", "trait4"],
    "musicDNA": "One sentence describing their core music identity"
  },
  "collectionInsights": {
    "uniqueness": "Assessment of how unique/rare this collection is",
    "coherence": "How cohesive the collection is",
    "curation": "Quality of curation and focus",
    "evolution": "How the collection shows musical journey evolution"
  },
  "artistConnections": {
    "collaborations": ["Notable artist collaborations found in collection"],
    "labelConnections": ["Interesting label patterns or connections"],
    "producerInsights": ["Notable producers or studios if detectable"],
    "genreEvolution": "How genres connect and influence each other in this collection"
  },
  "investmentInsights": {
    "hiddenGems": ["Potential undervalued items that might appreciate"],
    "premiumItems": ["Already valuable pieces"],
    "trends": "Market trends relevant to this collection",
    "completionOpportunities": ["Missing albums that would complete sets or themes"]
  },
  "culturalContext": {
    "decades": ["Most represented decades and their cultural significance"],
    "movements": ["Music movements or scenes represented"],
    "geography": "Geographic distribution and cultural relevance",
    "timeline": "Story of music history told through this collection"
  },
  "funFacts": [
    "Most surprising discovery about the collection",
    "Rarest or most unique aspect",
    "Mathematical or statistical insight",
    "Historical connection or coincidence",
    "Prediction about collector's next purchase"
  ],
  "recommendations": {
    "nextPurchases": ["5 specific album recommendations with reasons"],
    "genreExploration": ["New genres to explore based on current taste"],
    "artistDiscovery": ["New artists similar to collection favorites"],
    "collectionGaps": ["Notable gaps to fill in current collection themes"]
  },
  "collectionStory": "A 3-4 sentence narrative about what this collection tells about the person's musical journey and taste evolution"
}

Focus on being insightful, personal, and discovering hidden patterns. Avoid generic observations.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert music curator and collection analyst. Provide insightful, personal analysis in valid JSON format.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    console.log('✅ AI analysis completed successfully');

    // Return analysis with collection stats
    return new Response(JSON.stringify({
      success: true,
      analysis,
      stats: collectionSummary,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getTopItems(items: any[], field: string, limit: number) {
  const counts = new Map();
  items.forEach(item => {
    if (item[field]) {
      counts.set(item[field], (counts.get(item[field]) || 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function calculatePriceStats(items: any[]) {
  const itemsWithPrice = items.filter(item => 
    item.calculated_advice_price || item.median_price || item.marketplace_price
  );
  
  if (itemsWithPrice.length === 0) return null;
  
  const prices = itemsWithPrice.map(item => 
    Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0)
  );
  
  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = total / prices.length;
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  
  return { total, average, max, min, count: itemsWithPrice.length };
}

function getMostValuable(items: any[], limit: number) {
  return items
    .filter(item => item.calculated_advice_price || item.median_price || item.marketplace_price)
    .sort((a, b) => {
      const priceA = Number(a.calculated_advice_price || a.median_price || a.marketplace_price || 0);
      const priceB = Number(b.calculated_advice_price || b.median_price || b.marketplace_price || 0);
      return priceB - priceA;
    })
    .slice(0, limit)
    .map(item => ({
      artist: item.artist,
      title: item.title,
      price: Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0),
      format: item.format,
      year: item.year
    }));
}