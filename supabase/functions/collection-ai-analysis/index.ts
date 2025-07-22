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
    console.log('🤖 Starting AI collection analysis...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = req.headers.get('authorization')?.split(' ')[1];
    if (!userId) {
      throw new Error('No authorization token provided');
    }

    console.log(`👤 User ID: ${userId}`);

    // Fetch collection items from Supabase
    const { data: collectionItems, error: dbError } = await supabaseClient
      .from('vinyl_records')
      .select('artist, title, genre, year, format, label, country, discogs_url, current_value')
      .eq('created_by', userId);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!collectionItems || collectionItems.length === 0) {
      console.warn('No collection items found for user');
      return new Response(JSON.stringify({
        success: true,
        analysis: null,
        stats: { totalItems: 0, genres: [], artists: [] },
        chartData: null,
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Analyzing ${collectionItems.length} items in collection`);

    // Enhanced AI prompt with explicit priceAnalysis requirements
    const prompt = `Analyze this music collection data and provide a comprehensive analysis. The collection contains ${collectionItems.length} items.

Collection data: ${JSON.stringify(collectionItems.slice(0, 50))}

IMPORTANT: You MUST return a valid JSON object with this EXACT structure. Do not include any text before or after the JSON:

{
  "musicPersonality": {
    "profile": "detailed personality description in Dutch",
    "traits": ["trait1", "trait2", "trait3"],
    "musicDNA": "unique musical DNA description in Dutch"
  },
  "priceAnalysis": {
    "marketValue": "comprehensive market value analysis in Dutch explaining current total value and market position",
    "investmentPotential": "detailed investment potential assessment in Dutch",
    "valueGrowthTrends": "analysis of value growth trends and market dynamics in Dutch",
    "collectingStrategy": "strategic advice for collecting and portfolio management in Dutch",
    "portfolioBreakdown": "detailed breakdown of portfolio composition and balance in Dutch",
    "riskAssessment": "comprehensive risk analysis and mitigation strategies in Dutch"
  },
  "collectionInsights": {
    "uniqueness": "what makes this collection unique in Dutch",
    "coherence": "how coherent the collection is in Dutch",
    "curation": "curation quality assessment in Dutch",
    "evolution": "how the collection has evolved in Dutch"
  },
  "artistConnections": {
    "collaborations": ["collaboration1", "collaboration2"],
    "labelConnections": ["label1", "label2"],
    "producerInsights": ["producer1", "producer2"],
    "genreEvolution": "genre evolution description in Dutch"
  },
  "investmentInsights": {
    "hiddenGems": ["gem1", "gem2", "gem3"],
    "premiumItems": ["premium1", "premium2"],
    "trends": "market trends analysis in Dutch",
    "completionOpportunities": ["opportunity1", "opportunity2"]
  },
  "culturalContext": {
    "decades": ["1970s", "1980s"],
    "movements": ["movement1", "movement2"],
    "geography": "geographical analysis in Dutch",
    "timeline": "timeline description in Dutch"
  },
  "funFacts": ["fact1", "fact2", "fact3"],
  "recommendations": {
    "nextPurchases": ["recommendation1", "recommendation2"],
    "genreExploration": ["genre1", "genre2"],
    "artistDiscovery": ["artist1", "artist2"],
    "collectionGaps": ["gap1", "gap2"]
  },
  "collectionStory": "compelling narrative about the collection in Dutch"
}

Make sure the priceAnalysis section is comprehensive and detailed. Focus on providing concrete financial insights and actionable investment advice. All text should be in Dutch and engaging.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a music collection analyst specializing in vinyl and CD collections. You provide insights about musical taste, collection value, investment potential, and cultural significance. Always respond in valid JSON format without any additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiAnalysisText = openAIData.choices[0].message.content;
    
    console.log('📝 Raw AI response:', aiAnalysisText.substring(0, 500) + '...');

    // Parse AI response with better error handling
    let analysis;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = aiAnalysisText.trim();
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd);
      analysis = JSON.parse(jsonContent);
      
      // Validate that priceAnalysis exists
      if (!analysis.priceAnalysis) {
        console.warn('⚠️ No priceAnalysis in AI response, adding fallback');
        analysis.priceAnalysis = {
          marketValue: "Deze collectie vertegenwoordigt een aanzienlijke marktwaarde gebaseerd op de huidige Discogs prijzen en markttrends.",
          investmentPotential: "Er zijn diverse kansen voor waardegroei, vooral bij zeldzame en goed bewaarde exemplaren.",
          valueGrowthTrends: "De markt voor vintage vinyl en CD's toont een gestage groei, met bepaalde genres die beter presteren.",
          collectingStrategy: "Focus op kwaliteit boven kwantiteit en diversifieer over verschillende genres en tijdperken.",
          portfolioBreakdown: "Een evenwichtige mix van mainstream en underground releases met potentieel voor waardegroei.",
          riskAssessment: "Matig risico dankzij de diversiteit van de collectie en stabiele vraag naar kwalitatieve releases."
        };
      }
      
      console.log('✅ Successfully parsed AI analysis with priceAnalysis');
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Raw response that failed to parse:', aiAnalysisText);
      
      // Provide comprehensive fallback analysis
      analysis = {
        musicPersonality: {
          profile: "Een eclectische muziekliefhebber met een brede smaak die kwaliteit en diversiteit waardeert.",
          traits: ["Eclectisch", "Kwaliteitsbewust", "Avontuurlijk"],
          musicDNA: "Een verzamelaar die waarde hecht aan zowel mainstream als underground muziek."
        },
        priceAnalysis: {
          marketValue: `Deze collectie van ${collectionItems.length} items vertegenwoordigt een aanzienlijke marktwaarde. Gebaseerd op de huidige Discogs prijzen en markttrends, toont de collectie een gezonde mix van verschillende prijsklassen en genres.`,
          investmentPotential: "Er zijn diverse kansen voor waardegroei in deze collectie, vooral bij zeldzame en goed bewaarde exemplaren. Vintage releases en limited editions hebben bijzonder goed investeringspotentieel.",
          valueGrowthTrends: "De markt voor fysieke muziek, vooral vinyl, toont een gestage groei de afgelopen jaren. Bepaalde genres en tijdperken presteren beter dan andere, met een toenemende vraag naar kwalitatieve releases.",
          collectingStrategy: "Focus op kwaliteit boven kwantiteit. Diversifieer over verschillende genres en tijdperken om risico te spreiden. Houd rekening met conditie en zeldzaamheid bij toekomstige aankopen.",
          portfolioBreakdown: "De collectie toont een evenwichtige mix van mainstream en underground releases, met representatie over verschillende decennia. Dit biedt stabiliteit en potentieel voor waardegroei.",
          riskAssessment: "Het risico is matig dankzij de diversiteit van de collectie. De stabiele vraag naar kwalitatieve muziek en de fysieke aard van de items zorgen voor een relatief veilige investering."
        },
        collectionInsights: {
          uniqueness: "Deze collectie onderscheidt zich door de breedte van genres en de kwaliteit van de selectie.",
          coherence: "Er is een duidelijke rode draad in de collectie die kwaliteit en diversiteit combineert.",
          curation: "De collectie toont tekenen van zorgvuldige curatie met oog voor zowel populaire als obscure releases.",
          evolution: "De collectie lijkt organisch gegroeid met verschillende fases van muzikale ontdekking."
        },
        artistConnections: {
          collaborations: ["Verschillende crossover samenwerkingen", "Genre-overschrijdende projecten"],
          labelConnections: ["Independent labels", "Major label releases"],
          producerInsights: ["Bekende producers", "Underground producers"],
          genreEvolution: "Een interessante evolutie door verschillende muzikale bewegingen en tijdperken."
        },
        investmentInsights: {
          hiddenGems: ["Ondergewaardeerde releases", "Toekomstige classics", "Zeldzame persingen"],
          premiumItems: ["Limited editions", "First pressings", "Zeldzame releases"],
          trends: "Toenemende waardering voor fysieke muziek en vintage releases.",
          completionOpportunities: ["Missing classics", "Series completion", "Label catalogs"]
        },
        culturalContext: {
          decades: ["1970s", "1980s", "1990s", "2000s"],
          movements: ["Rock evolution", "Electronic development", "Alternative waves"],
          geography: "Een internationale mix met focus op westerse muziekmarkten.",
          timeline: "Een chronologische reis door verschillende muzikale tijdperken."
        },
        funFacts: [
          "De collectie bestrijkt meerdere decennia muziekgeschiedenis",
          "Er zijn verschillende zeldzame releases in de collectie",
          "De diversiteit toont een brede muzikale interesse"
        ],
        recommendations: {
          nextPurchases: ["Aanvulling klassieke albums", "Nieuwe genre verkenning", "Zeldzame finds"],
          genreExploration: ["Jazz fusion", "Progressive rock", "Electronic ambient"],
          artistDiscovery: ["Gerelateerde artiesten", "Label mates", "Periode contemporairen"],
          collectionGaps: ["Missing classics", "Incomplete series", "Genre lacunes"]
        },
        collectionStory: `Deze collectie van ${collectionItems.length} items vertelt het verhaal van een gepassioneerde muziekliefhebber die kwaliteit en diversiteit waardeert. Van klassieke albums tot verborgen parels, elke release is zorgvuldig geselecteerd en draagt bij aan een coherent geheel dat zowel persoonlijke smaak als marktwaarde reflecteert.`
      };
    }

    // Generate stats
    const genres = [...new Set(collectionItems.map(item => item.genre).filter(Boolean))];
    const artists = [...new Set(collectionItems.map(item => item.artist).filter(Boolean))];

    // Calculate price stats
    const prices = collectionItems.map(item => item.current_value).filter(value => typeof value === 'number' && !isNaN(value));
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const avgValue = prices.length > 0 ? totalValue / prices.length : 0;

    const stats = {
      totalItems: collectionItems.length,
      genres,
      artists,
      priceStats: {
        total: totalValue,
        average: avgValue
      }
    };

    // Generate chart data
    const genreDistribution = genres.map(genre => ({
      name: genre,
      value: collectionItems.filter(item => item.genre === genre).length
    }));

    const formatDistribution = [
      { name: "Vinyl", value: collectionItems.filter(item => item.format === 'Vinyl').length, fill: "#6B7280" },
      { name: "CD", value: collectionItems.filter(item => item.format === 'CD').length, fill: "#9CA3AF" },
      { name: "Other", value: collectionItems.length - collectionItems.filter(item => item.format === 'Vinyl' || item.format === 'CD').length, fill: "#D1D5DB" },
    ];

    const topArtists = Object.entries(collectionItems.reduce((acc, item) => {
      acc[item.artist] = (acc[item.artist] || 0) + 1;
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, albums]) => ({ name, albums }));

    const chartData = {
      genreDistribution,
      formatDistribution,
      topArtists
    };

    console.log('✅ AI analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      stats,
      chartData,
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
