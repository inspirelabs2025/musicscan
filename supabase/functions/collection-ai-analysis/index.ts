
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
    console.log('🎵 Starting AI collection analysis...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch CD collection data
    const { data: cdItems, error: cdError } = await supabaseClient
      .from('cd_scan')
      .select('artist, title, genre, year, format, label, country, discogs_url, calculated_advice_price, median_price, lowest_price, highest_price, style');

    if (cdError) {
      console.error('CD Database error:', cdError);
    }

    // Fetch vinyl collection data
    const { data: vinylItems, error: vinylError } = await supabaseClient
      .from('vinyl2_scan')
      .select('artist, title, genre, year, format, label, country, discogs_url, calculated_advice_price, median_price, lowest_price, highest_price, style');

    if (vinylError) {
      console.error('Vinyl Database error:', vinylError);
    }

    // Combine all collection items
    const allItems = [
      ...(cdItems || []).map(item => ({ ...item, source: 'cd_scan' })),
      ...(vinylItems || []).map(item => ({ ...item, source: 'vinyl2_scan' }))
    ];

    console.log(`📊 Found ${allItems.length} total items (${cdItems?.length || 0} CDs, ${vinylItems?.length || 0} vinyl)`);

    if (!allItems || allItems.length === 0) {
      console.warn('No collection items found');
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          musicPersonality: {
            profile: "Je collectie is nog aan het groeien! Tijd om je muzikale reis te beginnen.",
            traits: ["Beginnend verzamelaar", "Open voor ontdekking", "Potentieel groot"],
            musicDNA: "Een onbeschreven blad vol mogelijkheden."
          },
          priceAnalysis: {
            marketValue: "Je collectie heeft nog geen waarde data beschikbaar.",
            investmentPotential: "Elke collectie begint met één album.",
            valueGrowthTrends: "De waarde groeit met elke toevoeging.",
            collectingStrategy: "Begin met albums die je echt raakt.",
            portfolioBreakdown: "Nog geen portfolio om te analyseren.",
            riskAssessment: "Geen risico, alleen plezier in het verzamelen."
          },
          collectionInsights: {
            uniqueness: "Elke collectie is uniek vanaf het eerste album.",
            coherence: "De rode draad zal zich vanzelf ontvouwen.",
            curation: "Kwaliteit boven kwantiteit.",
            evolution: "Elke muziekliefhebber begint ergens."
          },
          artistConnections: {
            collaborations: [],
            labelConnections: [],
            producerInsights: [],
            genreEvolution: "Je muzikale smaak zal zich ontwikkelen."
          },
          investmentInsights: {
            hiddenGems: [],
            premiumItems: [],
            trends: "Investeer in wat je leuk vindt.",
            completionOpportunities: []
          },
          culturalContext: {
            decades: [],
            movements: [],
            geography: "Wereldwijd muzikaal potentieel.",
            timeline: "Je muzikale tijdlijn begint nu."
          },
          funFacts: [
            "Elke grote collectie begint met één album",
            "De beste investeringen zijn albums waar je van houdt",
            "Muziek verbindt alle tijdperken en culturen"
          ],
          recommendations: {
            nextPurchases: ["Start met je favoriete artiest", "Ontdek een nieuw genre"],
            genreExploration: ["Rock", "Jazz", "Electronic", "Classical"],
            artistDiscovery: ["Begin met de classics"],
            collectionGaps: ["Alles is nog een mogelijkheid"]
          },
          collectionStory: "Je muzikale verhaal begint hier. Elke grote collectie start met passie en nieuwsgierigheid."
        },
        stats: { totalItems: 0, genres: [], artists: [], priceStats: { total: 0, average: 0 } },
        chartData: {
          genreDistribution: [],
          formatDistribution: [],
          topArtists: []
        },
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced creative AI prompt as requested by user
    const prompt = `Je bent een creatieve, geestige en deskundige muziekanalist. Je specialiseert je in het maken van unieke persoonlijkheidsprofielen op basis van iemands LP- of CD-collectie. Je analyseert genres, tijdperken, stemmingen, populariteit, geografie en onderliggende thema's van de albums. Je vertaalt dit naar een inspirerend en herkenbaar profiel van iemands muzikale identiteit. Voeg waar mogelijk ook bekende artiesten toe waar de gebruiker op lijkt ('muzikale tweeling'), en geef 1 of 2 verrassende luistertips. Je tone of voice is vriendelijk, slim, en een tikje speels. Denk aan de stijl van een muziekfreak die een kop koffie met je drinkt.

Analyseer deze muziekcollectie van ${allItems.length} items en geef een uitgebreide analyse. 

Collectie data: ${JSON.stringify(allItems.slice(0, 50))}

BELANGRIJK: Je MOET een geldig JSON object teruggeven met EXACT deze structuur. Geen tekst voor of na de JSON:

{
  "musicPersonality": {
    "profile": "Uitgebreide persoonlijkheid beschrijving in het Nederlands - wie is deze muziekliefhebber?",
    "traits": ["eigenschap1", "eigenschap2", "eigenschap3"],
    "musicDNA": "Unieke muzikale DNA beschrijving - wat maakt deze collectie bijzonder?"
  },
  "priceAnalysis": {
    "marketValue": "Uitgebreide marktwaarde analyse in Nederlands met concrete prijsinzichten",
    "investmentPotential": "Gedetailleerde investeringspotentieel beoordeling",
    "valueGrowthTrends": "Analyse van waardeontwikkeling trends en marktdynamiek",
    "collectingStrategy": "Strategisch advies voor verzamelen en portfolio management",
    "portfolioBreakdown": "Gedetailleerde breakdown van portfolio samenstelling",
    "riskAssessment": "Uitgebreide risico analyse en mitigatie strategieën"
  },
  "collectionInsights": {
    "uniqueness": "Wat maakt deze collectie uniek",
    "coherence": "Hoe coherent is de collectie",
    "curation": "Kwaliteit van de curatie",
    "evolution": "Hoe de collectie is geëvolueerd"
  },
  "artistConnections": {
    "collaborations": ["samenwerking1", "samenwerking2"],
    "labelConnections": ["label1", "label2"],
    "producerInsights": ["producer1", "producer2"],
    "genreEvolution": "Genre evolutie beschrijving"
  },
  "investmentInsights": {
    "hiddenGems": ["verborgen parel1", "verborgen parel2"],
    "premiumItems": ["premium item1", "premium item2"],
    "trends": "Markt trends analyse",
    "completionOpportunities": ["kans1", "kans2"]
  },
  "culturalContext": {
    "decades": ["1970s", "1980s"],
    "movements": ["beweging1", "beweging2"],
    "geography": "Geografische analyse",
    "timeline": "Tijdlijn beschrijving"
  },
  "funFacts": ["feit1", "feit2", "feit3"],
  "recommendations": {
    "nextPurchases": ["aanbeveling1", "aanbeveling2"],
    "genreExploration": ["genre1", "genre2"],
    "artistDiscovery": ["artiest1", "artiest2"],
    "collectionGaps": ["lacune1", "lacune2"]
  },
  "collectionStory": "Een inspirerend verhaal over de collectie in het Nederlands"
}

Zorg ervoor dat de priceAnalysis sectie uitgebreid en gedetailleerd is met concrete financiële inzichten en bruikbaar investeringsadvies. Alle tekst moet in het Nederlands en boeiend zijn. Wees creatief, geestig en deskundig!`;

    console.log('🤖 Calling OpenAI with enhanced creative prompt...');

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
            content: 'Je bent een creatieve, geestige en deskundige muziekanalist. Je specialiseert je in het maken van unieke persoonlijkheidsprofielen op basis van iemands LP- of CD-collectie. Voeg waar mogelijk ook bekende artiesten toe waar de gebruiker op lijkt (\'muzikale tweeling\'), en geef 1 of 2 verrassende luistertips. Je tone of voice is vriendelijk, slim, en een tikje speels. Denk aan de stijl van een muziekfreak die een kop koffie met je drinkt. Antwoord altijd in geldig JSON format zonder extra tekst.'
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

    // Parse AI response with enhanced error handling
    let analysis;
    try {
      const cleanedResponse = aiAnalysisText.trim();
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd);
      analysis = JSON.parse(jsonContent);
      
      console.log('✅ Successfully parsed AI analysis');
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      
      // Enhanced fallback analysis with price calculations
      const prices = allItems
        .map(item => item.calculated_advice_price || item.median_price || 0)
        .filter(price => price > 0);
      const totalValue = prices.reduce((sum, price) => sum + price, 0);
      const avgValue = prices.length > 0 ? totalValue / prices.length : 0;
      
      analysis = {
        musicPersonality: {
          profile: `Een fascinerende muziekliefhebber met een collectie van ${allItems.length} items die een brede smaak en liefde voor kwaliteit toont.`,
          traits: ["Eclectisch", "Kwaliteitsbewust", "Gepassioneerd verzamelaar"],
          musicDNA: "Een verzamelaar die waarde hecht aan zowel muzikale diversiteit als collector's items."
        },
        priceAnalysis: {
          marketValue: `Deze indrukwekkende collectie van ${allItems.length} items heeft een geschatte totale waarde van €${totalValue.toFixed(2)}. Met een gemiddelde waarde van €${avgValue.toFixed(2)} per item toont de collectie een gezonde mix van betaalbare classics en waardevolle releases.`,
          investmentPotential: "Er zijn diverse kansen voor waardegroei in deze collectie, vooral bij zeldzame releases en limited editions. Vintage vinyl en eerste persingen hebben bijzonder goed investeringspotentieel.",
          valueGrowthTrends: "De markt voor fysieke muziek toont een gestage groei. Bepaalde genres en tijdperken presteren beter, met toenemende vraag naar kwalitatieve releases.",
          collectingStrategy: "Focus op kwaliteit boven kwantiteit. Diversifieer over verschillende genres en tijdperken om risico te spreiden. Let op conditie en zeldzaamheid.",
          portfolioBreakdown: `De collectie bestaat uit ${cdItems?.length || 0} CDs en ${vinylItems?.length || 0} vinyl releases. Dit biedt een evenwichtige mix van toegankelijkheid (CD) en collector's value (vinyl).`,
          riskAssessment: "Matig risico dankzij de diversiteit van de collectie. Fysieke muziek blijft stabiel in waarde met goede liquiditeit voor populaire releases."
        },
        collectionInsights: {
          uniqueness: "Deze collectie onderscheidt zich door de breedte van genres en de kwaliteit van de selectie.",
          coherence: "Er is een duidelijke rode draad die kwaliteit en diversiteit combineert.",
          curation: "De collectie toont zorgvuldige curatie met oog voor zowel populaire als obscure releases.",
          evolution: "Een organisch gegroeide collectie met verschillende fases van muzikale ontdekking."
        },
        artistConnections: {
          collaborations: ["Cross-genre samenwerkingen", "Producer connecties"],
          labelConnections: ["Independent labels", "Major label releases"],
          producerInsights: ["Bekende producers", "Underground talent"],
          genreEvolution: "Een interessante evolutie door verschillende muzikale bewegingen en tijdperken."
        },
        investmentInsights: {
          hiddenGems: ["Ondergewaardeerde releases", "Toekomstige classics"],
          premiumItems: ["Limited editions", "First pressings"],
          trends: "Toenemende waardering voor fysieke muziek en authentieke releases.",
          completionOpportunities: ["Missing classics", "Series completion"]
        },
        culturalContext: {
          decades: ["1970s", "1980s", "1990s", "2000s"],
          movements: ["Rock evolution", "Electronic development"],
          geography: "Een internationale mix met focus op westerse muziekmarkten.",
          timeline: "Een chronologische reis door verschillende muzikale tijdperken."
        },
        funFacts: [
          `De collectie bevat ${allItems.length} unieke releases`,
          "Er zijn verschillende zeldzame items in de collectie",
          "De diversiteit toont een brede muzikale interesse"
        ],
        recommendations: {
          nextPurchases: ["Aanvulling klassieke albums", "Nieuwe genre verkenning"],
          genreExploration: ["Jazz fusion", "Progressive rock"],
          artistDiscovery: ["Gerelateerde artiesten", "Label mates"],
          collectionGaps: ["Missing classics", "Genre lacunes"]
        },
        collectionStory: `Deze collectie van ${allItems.length} items vertelt het verhaal van een gepassioneerde muziekliefhebber. Van CDs tot vinyl, elke release is zorgvuldig geselecteerd en draagt bij aan een coherent geheel dat zowel persoonlijke smaak als collector's waarde reflecteert.`
      };
    }

    // Generate enhanced stats with price analysis
    const genres = [...new Set(allItems.map(item => item.genre).filter(Boolean))];
    const artists = [...new Set(allItems.map(item => item.artist).filter(Boolean))];
    
    // Calculate comprehensive price stats
    const prices = allItems
      .map(item => item.calculated_advice_price || item.median_price || 0)
      .filter(price => price > 0);
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const avgValue = prices.length > 0 ? totalValue / prices.length : 0;

    const stats = {
      totalItems: allItems.length,
      genres,
      artists,
      priceStats: {
        total: totalValue,
        average: avgValue,
        itemsWithPricing: prices.length,
        cdCount: cdItems?.length || 0,
        vinylCount: vinylItems?.length || 0
      }
    };

    // Generate enhanced chart data
    const genreDistribution = genres.map(genre => ({
      name: genre,
      value: allItems.filter(item => item.genre === genre).length,
      percentage: Math.round((allItems.filter(item => item.genre === genre).length / allItems.length) * 100)
    }));

    const formatDistribution = [
      { name: "CD", value: cdItems?.length || 0, fill: "#6B7280" },
      { name: "Vinyl", value: vinylItems?.length || 0, fill: "#9CA3AF" }
    ].filter(item => item.value > 0);

    const topArtists = Object.entries(
      allItems.reduce((acc, item) => {
        if (item.artist) {
          acc[item.artist] = (acc[item.artist] || 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, albums]) => ({ name, albums }));

    const chartData = {
      genreDistribution,
      formatDistribution,
      topArtists,
      priceByDecade: [],
      valueByGenre: genres.map(genre => {
        const genreItems = allItems.filter(item => item.genre === genre);
        const genrePrices = genreItems
          .map(item => item.calculated_advice_price || item.median_price || 0)
          .filter(price => price > 0);
        const avgPrice = genrePrices.length > 0 ? genrePrices.reduce((sum, price) => sum + price, 0) / genrePrices.length : 0;
        return {
          genre,
          avgPrice,
          count: genreItems.length,
          totalValue: genrePrices.reduce((sum, price) => sum + price, 0)
        };
      })
    };

    console.log('✅ AI analysis completed successfully with enhanced data');

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
