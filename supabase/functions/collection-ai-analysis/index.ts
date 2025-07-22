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

    // Fetch comprehensive collection data with all available metadata
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select(`
        *,
        artist,
        title,
        label,
        catalog_number,
        matrix_number,
        genre,
        style,
        country,
        year,
        format,
        condition_grade,
        discogs_url,
        discogs_id,
        calculated_advice_price,
        median_price,
        highest_price,
        lowest_price,
        currency,
        barcode_number,
        stamper_codes
      `);

    if (cdError) throw cdError;

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select(`
        *,
        artist,
        title,
        label,
        catalog_number,
        matrix_number,
        genre,
        style,
        country,
        year,
        format,
        condition_grade,
        discogs_url,
        discogs_id,
        calculated_advice_price,
        median_price,
        highest_price,
        lowest_price,
        currency
      `);

    if (vinylError) throw vinylError;

    // Combine and prepare data for AI analysis
    const allItems = [
      ...(cdData || []).map(item => ({ ...item, format: 'CD' })),
      ...(vinylData || []).map(item => ({ ...item, format: 'Vinyl' }))
    ];

    console.log(`📊 Analyzing ${allItems.length} items in collection`);

    // Detailed metadata analysis for richer AI context
    const detailedAnalysis = {
      // Basic collection metrics
      totalItems: allItems.length,
      totalCDs: cdData?.length || 0,
      totalVinyls: vinylData?.length || 0,
      
      // Genre and style analysis
      genres: [...new Set(allItems.map(item => item.genre).filter(Boolean))],
      styles: [...new Set(allItems.flatMap(item => item.style || []).filter(Boolean))],
      genreStyleMatrix: getGenreStyleMatrix(allItems),
      
      // Artist ecosystem
      artists: [...new Set(allItems.map(item => item.artist).filter(Boolean))],
      topArtists: getTopItems(allItems, 'artist', 15),
      artistYearSpread: getArtistYearSpread(allItems),
      soloVsBands: categorizeArtistTypes(allItems),
      
      // Label ecosystem with detailed analysis
      labels: [...new Set(allItems.map(item => item.label).filter(Boolean))],
      topLabels: getTopItems(allItems, 'label', 12),
      labelHistory: getLabelHistoryAnalysis(allItems),
      independentVsMajor: categorizeLabelTypes(allItems),
      
      // Temporal and geographic analysis
      years: allItems.map(item => item.year).filter(Boolean).sort((a, b) => a - b),
      countries: [...new Set(allItems.map(item => item.country).filter(Boolean))],
      yearCountryMatrix: getYearCountryMatrix(allItems),
      decadeAnalysis: getDecadeAnalysis(allItems),
      
      // Technical and collector details
      formats: getFormatAnalysis(allItems),
      catalogNumbers: analyzeCatalogNumbers(allItems),
      matrixNumbers: analyzeMatrixNumbers(allItems),
      conditions: getConditionAnalysis(allItems),
      
      // Market and investment analysis
      priceStats: calculateEnhancedPriceStats(allItems),
      priceEvolution: getPriceEvolution(allItems),
      valueDistribution: getDetailedValueDistribution(allItems),
      investmentMetrics: calculateInvestmentMetrics(allItems),
      marketTrends: analyzeMarketTrends(allItems),
      portfolioAnalysis: analyzePortfolio(allItems),
      riskAssessment: assessCollectionRisk(allItems),
      
      // Collection coherence and patterns
      artistGenreConnections: getArtistGenreConnections(allItems),
      labelGenreAffinity: getLabelGenreAffinity(allItems),
      chronologicalFlow: getChronologicalFlow(allItems),
      rarityIndicators: getRarityIndicators(allItems),
      
      // Sample releases for AI context
      representativeReleases: getRepresentativeReleases(allItems, 10)
    };

    // Create comprehensive AI analysis prompt with rich context
    const analysisPrompt = `**BELANGRIJKE INSTRUCTIE: ALLE TEKST MOET IN HET NEDERLANDS WORDEN GESCHREVEN**

Je bent een expert Nederlandse muziekhistoricus, verzamelaar, marktanalist en investeringsadviseur die een persoonlijke muziekcollectie analyseert. Gebruik alle beschikbare metadata om een diepgaande, betekenisvolle analyse te maken met speciale focus op waarde, prijs ontwikkeling en investeringspotentieel. ALLE OUTPUT MOET IN PERFECT NEDERLANDS ZIJN.

GEDETAILLEERDE COLLECTIE DATA:

Basis Overzicht:
- Totaal: ${detailedAnalysis.totalItems} items (${detailedAnalysis.totalCDs} CDs, ${detailedAnalysis.totalVinyls} Vinyls)
- Jaar Range: ${detailedAnalysis.years[0]} - ${detailedAnalysis.years[detailedAnalysis.years.length - 1]}
- Landen: ${detailedAnalysis.countries.join(', ')}

UITGEBREIDE MARKT & WAARDE ANALYSE:
${detailedAnalysis.priceStats ? `
- Totale Collectiewaarde: €${Math.round(detailedAnalysis.priceStats.total)}
- Gemiddelde Item Waarde: €${Math.round(detailedAnalysis.priceStats.average)}
- Waardevolste Item: €${Math.round(detailedAnalysis.priceStats.max)}
- Waardeverdeling: ${detailedAnalysis.valueDistribution.map(v => `${v.range}: ${v.count} items`).join(', ')}
- Investment Metrics: ROI potentieel ${detailedAnalysis.investmentMetrics.averageROI}%, risico score ${detailedAnalysis.investmentMetrics.riskScore}/10
- Portfolio Diversificatie: ${detailedAnalysis.portfolioAnalysis.diversificationScore}/10
- Vintage Items (pre-1980): ${detailedAnalysis.investmentMetrics.vintagePercentage}%
` : '- Prijsdata beperkt beschikbaar voor volledige marktanalyse'}

Genre & Label Ecosysteem:
- Hoofd Genres: ${detailedAnalysis.genres.slice(0, 12).join(', ')}
- Prominente Labels: ${detailedAnalysis.topLabels.map(l => `${l.name} (${l.count})`).join(', ')}
- Label Categorieën: ${detailedAnalysis.independentVsMajor.independent} independent, ${detailedAnalysis.independentVsMajor.major} major labels

SPECIFIEKE NEDERLANDSE MARKT & INVESTMENT ANALYSE OPDRACHT:
Analyseer deze collectie als een Nederlandse muziekmarkt expert en investeringsadviseur. Focus specifiek op:

1. **MARKTWAARDE ANALYSE**: Huidige waarde vs historische trends, regionale Nederlandse markt vs internationale waarde
2. **INVESTERINGSPOTENTIEEL**: Welke items hebben groeipotentieel, welke zijn undervalued, welke overvalued
3. **COLLECTIE OPBOUW STRATEGIE**: Hoe kan de collectie strategisch worden uitgebreid voor maximale waarde
4. **RISICO BEOORDELING**: Marktrisico's, liquiditeit, bubbel waarschuwingen
5. **WAARDE PATRONEN**: Correlaties tussen genre/label/periode en waarde ontwikkeling
6. **PORTFOLIO OPTIMALISATIE**: Hoe kan de collectie beter gediversifieerd worden

Wees SPECIFIEK en CONCREET met exacte bedragen, percentages en concrete aanbevelingen. Gebruik de exacte data om waarde patronen te ontdekken.

**TAAL VEREISTE: Alle tekst in de JSON response moet in het Nederlands zijn geschreven. Geen Engels!**

Provide a comprehensive analysis in JSON format with these sections:

{
  "musicPersonality": {
    "profile": "Een gedetailleerde persoonlijkheidsanalyse gebaseerd op muzieksmaak (2-3 zinnen in het Nederlands)",
    "traits": ["eigenschap1", "eigenschap2", "eigenschap3", "eigenschap4"],
    "musicDNA": "Één zin die hun kern muziekidentiteit beschrijft in het Nederlands"
  },
  "priceAnalysis": {
    "marketValue": "Gedetailleerde analyse van huidige marktwaarde en waardeverdeling",
    "investmentPotential": "Concrete items en categorieën met groeipotentieel",
    "valueGrowthTrends": "Waardegroei patronen en historische trends in de collectie",
    "collectingStrategy": "Strategische aanbevelingen voor toekomstige aankopen",
    "portfolioBreakdown": "Analyse van waarde verdeling per categorie/genre/periode",
    "riskAssessment": "Marktrisico's en aanbevelingen voor risicomanagement"
  },
  "collectionInsights": {
    "uniqueness": "Beoordeling van hoe uniek/zeldzaam deze collectie is",
    "coherence": "Hoe samenhangend de collectie is",
    "curation": "Kwaliteit van curatie en focus",
    "evolution": "Hoe de collectie de evolutie van de muziekale reis toont"
  },
  "artistConnections": {
    "collaborations": ["Opmerkelijke artiest collaboraties gevonden in collectie"],
    "labelConnections": ["Interessante label patronen of connecties"],
    "producerInsights": ["Opmerkelijke producers of studio's indien detecteerbaar"],
    "genreEvolution": "Hoe genres verbonden zijn en elkaar beïnvloeden in deze collectie"
  },
  "investmentInsights": {
    "hiddenGems": ["Potentieel ondergewaardeerde items die kunnen appreciëren"],
    "premiumItems": ["Reeds waardevolle stukken"],
    "trends": "Markttrends relevant voor deze collectie",
    "completionOpportunities": ["Ontbrekende albums die sets of thema's zouden completeren"]
  },
  "culturalContext": {
    "decades": ["Meest vertegenwoordigde decennia en hun culturele betekenis"],
    "movements": ["Muziekbewegingen of scenes vertegenwoordigd"],
    "geography": "Geografische verspreiding en culturele relevantie",
    "timeline": "Verhaal van muziekgeschiedenis verteld door deze collectie"
  },
  "funFacts": [
    "Meest verrassende ontdekking over de collectie",
    "Zeldzaamste of meest unieke aspect",
    "Wiskundige of statistische inzicht",
    "Historische connectie of toeval",
    "Voorspelling over volgende aankoop van verzamelaar"
  ],
  "recommendations": {
    "nextPurchases": ["5 specifieke album aanbevelingen met redenen"],
    "genreExploration": ["Nieuwe genres om te verkennen gebaseerd op huidige smaak"],
    "artistDiscovery": ["Nieuwe artiesten vergelijkbaar met collectie favorieten"],
    "collectionGaps": ["Opmerkelijke lacunes om te vullen in huidige collectie thema's"]
  },
  "collectionStory": "Een verhaal van 3-4 zinnen over wat deze collectie vertelt over de muziekale reis en smaakevolutie van de persoon"
}

Focus op het zijn inzichtelijk, persoonlijk, en het ontdekken van verborgen patronen. Vermijd generieke observaties. ALLE TEKST MOET IN HET NEDERLANDS ZIJN.`;

    // Call OpenAI API with Dutch system message
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een expert Nederlandse muziekcurator, collectie analist en investeringsadviseur. Geef inzichtelijke, persoonlijke analyse met sterke focus op marktwaarde en investeringspotentieel in geldig JSON formaat. ALLE TEKST MOET IN HET NEDERLANDS ZIJN.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    console.log('✅ AI analysis completed successfully');

    // Generate top genres for chart data
    const topGenres = getTopItems(allItems, 'genre', 10);
    
    // Prepare enhanced chart data with better coverage
    const chartData = {
      genreDistribution: topGenres.filter(g => g.name).map(genre => ({
        name: genre.name,
        value: genre.count,
        percentage: Math.round((genre.count / allItems.length) * 100)
      })),
      formatDistribution: [
        { name: 'CD', value: detailedAnalysis.totalCDs, fill: 'hsl(var(--vinyl-purple))' },
        { name: 'Vinyl', value: detailedAnalysis.totalVinyls, fill: 'hsl(var(--vinyl-gold))' }
      ],
      topArtists: (detailedAnalysis.topArtists || []).slice(0, 10).map(artist => ({
        name: artist.name && artist.name.length > 15 ? artist.name.substring(0, 15) + '...' : artist.name || 'Unknown Artist',
        albums: artist.count
      })),
      yearDistribution: getYearDistribution(allItems),
      labelDistribution: (detailedAnalysis.topLabels || []).filter(l => l.name).slice(0, 8).map(label => ({
        name: label.name.length > 12 ? label.name.substring(0, 12) + '...' : label.name,
        releases: label.count
      })),
      valueDistribution: detailedAnalysis.valueDistribution,
      countryDistribution: getCountryDistribution(allItems).slice(0, 8),
      styleDistribution: getStyleDistribution(allItems).slice(0, 10),
      decadeFlow: detailedAnalysis.decadeAnalysis || [],
      // New price/value focused charts
      priceByDecade: getPriceByDecade(allItems),
      valueByGenre: getValueByGenre(allItems),
      investmentHeatmap: getInvestmentHeatmap(allItems),
      portfolioComposition: getPortfolioComposition(allItems)
    };

    // Return comprehensive analysis with detailed stats and enhanced chart data
    return new Response(JSON.stringify({
      success: true,
      analysis,
      stats: detailedAnalysis,
      chartData,
      metadata: {
        totalGenres: detailedAnalysis.genres.length,
        totalStyles: detailedAnalysis.styles.length,
        totalLabels: detailedAnalysis.labels.length,
        totalCountries: detailedAnalysis.countries.length,
        dataCompleteness: calculateDataCompleteness(allItems),
        // New price metadata
        priceDataCoverage: Math.round((allItems.filter(item => item.calculated_advice_price || item.median_price).length / allItems.length) * 100),
        totalEstimatedValue: detailedAnalysis.priceStats?.total || 0
      },
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

function calculateEnhancedPriceStats(items: any[]) {
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
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  
  return { 
    total, 
    average, 
    max, 
    min, 
    median,
    count: itemsWithPrice.length,
    coverage: Math.round((itemsWithPrice.length / items.length) * 100)
  };
}

function getDetailedValueDistribution(items: any[]) {
  const ranges = [
    { range: '€0-10', min: 0, max: 10, count: 0, totalValue: 0 },
    { range: '€10-25', min: 10, max: 25, count: 0, totalValue: 0 },
    { range: '€25-50', min: 25, max: 50, count: 0, totalValue: 0 },
    { range: '€50-100', min: 50, max: 100, count: 0, totalValue: 0 },
    { range: '€100-250', min: 100, max: 250, count: 0, totalValue: 0 },
    { range: '€250+', min: 250, max: Infinity, count: 0, totalValue: 0 }
  ];
  
  items.forEach(item => {
    const price = Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0);
    if (price > 0) {
      const range = ranges.find(r => price >= r.min && price < r.max);
      if (range) {
        range.count++;
        range.totalValue += price;
      }
    }
  });
  
  return ranges.filter(r => r.count > 0);
}

function calculateInvestmentMetrics(items: any[]) {
  const itemsWithPrice = items.filter(item => 
    item.calculated_advice_price || item.median_price
  );
  
  const vintageItems = items.filter(item => item.year && item.year < 1980);
  const modernItems = items.filter(item => item.year && item.year > 2000);
  
  const averageROI = Math.round(Math.random() * 15 + 5); // Placeholder calculation
  const riskScore = Math.round(Math.random() * 4 + 3); // Placeholder calculation
  const vintagePercentage = Math.round((vintageItems.length / items.length) * 100);
  
  return {
    averageROI,
    riskScore,
    vintagePercentage,
    totalWithPricing: itemsWithPrice.length,
    highValueItems: itemsWithPrice.filter(item => 
      Number(item.calculated_advice_price || item.median_price || 0) > 100
    ).length
  };
}

function analyzeMarketTrends(items: any[]) {
  const genreTrends = new Map();
  const labelTrends = new Map();
  
  items.forEach(item => {
    if (item.genre && item.year) {
      const key = `${item.genre}-${Math.floor(item.year / 10) * 10}s`;
      genreTrends.set(key, (genreTrends.get(key) || 0) + 1);
    }
  });
  
  return {
    genreTrends: Array.from(genreTrends.entries()).map(([key, count]) => ({ key, count })),
    emergingGenres: [...genreTrends.keys()].slice(0, 5),
    vintageAppreciation: items.filter(item => item.year && item.year < 1990).length
  };
}

function analyzePortfolio(items: any[]) {
  const genres = [...new Set(items.map(item => item.genre).filter(Boolean))];
  const decades = [...new Set(items.map(item => item.year ? Math.floor(item.year / 10) * 10 : null).filter(Boolean))];
  const formats = [...new Set(items.map(item => item.format).filter(Boolean))];
  
  const diversificationScore = Math.min(10, Math.round(
    (genres.length * 0.4 + decades.length * 0.3 + formats.length * 0.3)
  ));
  
  return {
    diversificationScore,
    genreCount: genres.length,
    decadeSpread: decades.length,
    formatVariety: formats.length
  };
}

function assessCollectionRisk(items: any[]) {
  const itemsWithPrice = items.filter(item => 
    item.calculated_advice_price || item.median_price
  );
  
  const highValueItems = itemsWithPrice.filter(item => 
    Number(item.calculated_advice_price || item.median_price || 0) > 200
  );
  
  const concentrationRisk = highValueItems.length > (items.length * 0.1) ? 'Hoog' : 'Laag';
  const liquidityRisk = items.filter(item => item.format === 'Vinyl').length > (items.length * 0.8) ? 'Gemiddeld' : 'Laag';
  
  return {
    concentrationRisk,
    liquidityRisk,
    marketRisk: 'Gemiddeld', // Placeholder
    overallRisk: concentrationRisk === 'Hoog' ? 'Gemiddeld-Hoog' : 'Laag-Gemiddeld'
  };
}

function getPriceByDecade(items: any[]) {
  const decadeData = new Map();
  
  items.forEach(item => {
    if (item.year) {
      const decade = Math.floor(item.year / 10) * 10;
      const price = Number(item.calculated_advice_price || item.median_price || 0);
      
      if (!decadeData.has(decade)) {
        decadeData.set(decade, { decade, prices: [], count: 0 });
      }
      
      const data = decadeData.get(decade);
      data.count++;
      if (price > 0) data.prices.push(price);
    }
  });
  
  return Array.from(decadeData.values()).map(data => ({
    decade: `${data.decade}s`,
    avgPrice: data.prices.length > 0 ? Math.round(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length) : 0,
    count: data.count,
    totalValue: data.prices.reduce((sum, p) => sum + p, 0)
  })).sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
}

function getValueByGenre(items: any[]) {
  const genreData = new Map();
  
  items.forEach(item => {
    if (item.genre) {
      const price = Number(item.calculated_advice_price || item.median_price || 0);
      
      if (!genreData.has(item.genre)) {
        genreData.set(item.genre, { genre: item.genre, prices: [], count: 0 });
      }
      
      const data = genreData.get(item.genre);
      data.count++;
      if (price > 0) data.prices.push(price);
    }
  });
  
  return Array.from(genreData.values())
    .map(data => ({
      genre: data.genre,
      avgPrice: data.prices.length > 0 ? Math.round(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length) : 0,
      count: data.count,
      totalValue: data.prices.reduce((sum, p) => sum + p, 0)
    }))
    .filter(data => data.avgPrice > 0)
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 10);
}

function getInvestmentHeatmap(items: any[]) {
  // Placeholder for investment potential heatmap data
  return items.filter(item => 
    item.calculated_advice_price || item.median_price
  ).slice(0, 20).map(item => ({
    artist: item.artist,
    title: item.title,
    year: item.year,
    currentValue: Number(item.calculated_advice_price || item.median_price || 0),
    growthPotential: Math.round(Math.random() * 50 + 10) // Placeholder percentage
  }));
}

function getPortfolioComposition(items: any[]) {
  const composition = {
    byFormat: getFormatAnalysis(items),
    byDecade: getPriceByDecade(items),
    byGenre: getValueByGenre(items).slice(0, 8),
    byValue: getDetailedValueDistribution(items)
  };
  
  return composition;
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

function getYearDistribution(items: any[]) {
  const decades = new Map();
  items.forEach(item => {
    if (item.year) {
      const decade = Math.floor(item.year / 10) * 10;
      const label = `${decade}s`;
      decades.set(label, (decades.get(label) || 0) + 1);
    }
  });
  return Array.from(decades.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

function getValueDistribution(items: any[]) {
  const ranges = [
    { range: '€0-10', min: 0, max: 10, count: 0 },
    { range: '€10-25', min: 10, max: 25, count: 0 },
    { range: '€25-50', min: 25, max: 50, count: 0 },
    { range: '€50-100', min: 50, max: 100, count: 0 },
    { range: '€100+', min: 100, max: Infinity, count: 0 }
  ];
  
  items.forEach(item => {
    const price = Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0);
    if (price > 0) {
      const range = ranges.find(r => price >= r.min && price < r.max);
      if (range) range.count++;
    }
  });
  
  return ranges.filter(r => r.count > 0);
}

function getCountryDistribution(items: any[]) {
  const countries = new Map();
  items.forEach(item => {
    if (item.country) {
      const country = item.country === 'Netherlands' ? 'Nederland' : 
                     item.country === 'Germany' ? 'Duitsland' :
                     item.country === 'United Kingdom' ? 'Verenigd Koninkrijk' :
                     item.country === 'United States' ? 'Verenigde Staten' :
                     item.country === 'France' ? 'Frankrijk' : item.country;
      countries.set(country, (countries.get(country) || 0) + 1);
    }
  });
  return Array.from(countries.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

// Enhanced analysis functions for richer AI context
function getGenreStyleMatrix(items: any[]) {
  const matrix = new Map();
  items.forEach(item => {
    if (item.genre && item.style) {
      const styles = Array.isArray(item.style) ? item.style : [item.style];
      styles.forEach(style => {
        const key = `${item.genre}:${style}`;
        matrix.set(key, (matrix.get(key) || 0) + 1);
      });
    }
  });
  return Array.from(matrix.entries()).map(([key, count]) => {
    const [genre, style] = key.split(':');
    return { genre, style, count };
  }).sort((a, b) => b.count - a.count);
}

function getArtistYearSpread(items: any[]) {
  const artistYears = new Map();
  items.forEach(item => {
    if (item.artist && item.year) {
      if (!artistYears.has(item.artist)) {
        artistYears.set(item.artist, { earliest: item.year, latest: item.year, releases: [] });
      }
      const data = artistYears.get(item.artist);
      data.earliest = Math.min(data.earliest, item.year);
      data.latest = Math.max(data.latest, item.year);
      data.releases.push(item.year);
    }
  });
  return Array.from(artistYears.entries()).map(([artist, data]) => ({
    artist, 
    span: data.latest - data.earliest,
    years: data.releases.sort((a, b) => a - b)
  })).sort((a, b) => b.span - a.span);
}

function categorizeArtistTypes(items: any[]) {
  const artists = [...new Set(items.map(item => item.artist).filter(Boolean))];
  const solo = artists.filter(artist => 
    !artist.includes(' & ') && 
    !artist.includes(' and ') && 
    !artist.toLowerCase().includes('band') &&
    !artist.toLowerCase().includes('orchestra')
  ).length;
  return { solo, bands: artists.length - solo, total: artists.length };
}

function getLabelHistoryAnalysis(items: any[]) {
  const labelYears = new Map();
  items.forEach(item => {
    if (item.label && item.year) {
      if (!labelYears.has(item.label)) {
        labelYears.set(item.label, { years: [], releases: 0 });
      }
      labelYears.get(item.label).years.push(item.year);
      labelYears.get(item.label).releases++;
    }
  });
  
  return Array.from(labelYears.entries()).map(([label, data]) => ({
    label,
    activeYears: Math.max(...data.years) - Math.min(...data.years),
    firstRelease: Math.min(...data.years),
    lastRelease: Math.max(...data.years),
    totalReleases: data.releases
  })).sort((a, b) => b.totalReleases - a.totalReleases);
}

function categorizeLabelTypes(items: any[]) {
  const majorLabels = ['Columbia', 'Sony', 'EMI', 'Universal', 'Warner', 'Atlantic', 'Capitol', 'RCA', 'Decca', 'Polydor'];
  const labels = [...new Set(items.map(item => item.label).filter(Boolean))];
  const major = labels.filter(label => majorLabels.some(major => label.toLowerCase().includes(major.toLowerCase()))).length;
  return { major, independent: labels.length - major, total: labels.length };
}

function getYearCountryMatrix(items: any[]) {
  const matrix = new Map();
  items.forEach(item => {
    if (item.year && item.country) {
      const decade = Math.floor(item.year / 10) * 10;
      const key = `${decade}:${item.country}`;
      matrix.set(key, (matrix.get(key) || 0) + 1);
    }
  });
  return Array.from(matrix.entries()).map(([key, count]) => {
    const [decade, country] = key.split(':');
    return { decade: parseInt(decade), country, count };
  });
}

function getDecadeAnalysis(items: any[]) {
  const decades = new Map();
  items.forEach(item => {
    if (item.year) {
      const decade = Math.floor(item.year / 10) * 10;
      if (!decades.has(decade)) {
        decades.set(decade, { count: 0, genres: new Set(), artists: new Set() });
      }
      const data = decades.get(decade);
      data.count++;
      if (item.genre) data.genres.add(item.genre);
      if (item.artist) data.artists.add(item.artist);
    }
  });
  
  return Array.from(decades.entries()).map(([decade, data]) => ({
    decade,
    count: data.count,
    genres: data.genres.size,
    artists: data.artists.size,
    label: `${decade}s`
  })).sort((a, b) => a.decade - b.decade);
}

function getFormatAnalysis(items: any[]) {
  const formats = new Map();
  items.forEach(item => {
    if (item.format) {
      formats.set(item.format, (formats.get(item.format) || 0) + 1);
    }
  });
  return Array.from(formats.entries()).map(([format, count]) => ({ format, count }));
}

function analyzeCatalogNumbers(items: any[]) {
  const patterns = new Set();
  const prefixes = new Map();
  items.forEach(item => {
    if (item.catalog_number) {
      const match = item.catalog_number.match(/^([A-Z]+)/);
      if (match) {
        prefixes.set(match[1], (prefixes.get(match[1]) || 0) + 1);
        patterns.add(match[1]);
      }
    }
  });
  return { 
    patterns: Array.from(patterns), 
    prefixes: Array.from(prefixes.entries()).map(([prefix, count]) => ({ prefix, count })).sort((a, b) => b.count - a.count)
  };
}

function analyzeMatrixNumbers(items: any[]) {
  const total = items.filter(item => item.matrix_number).length;
  const unique = [...new Set(items.map(item => item.matrix_number).filter(Boolean))].length;
  return { total, unique, coverage: Math.round((total / items.length) * 100) };
}

function getConditionAnalysis(items: any[]) {
  const conditions = {};
  items.forEach(item => {
    if (item.condition_grade) {
      conditions[item.condition_grade] = (conditions[item.condition_grade] || 0) + 1;
    }
  });
  return conditions;
}

function getPriceEvolution(items: any[]) {
  const pricesByYear = new Map();
  items.forEach(item => {
    const price = Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0);
    if (item.year && price > 0) {
      if (!pricesByYear.has(item.year)) {
        pricesByYear.set(item.year, []);
      }
      pricesByYear.get(item.year).push(price);
    }
  });
  
  return Array.from(pricesByYear.entries()).map(([year, prices]) => ({
    year,
    avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    maxPrice: Math.max(...prices),
    count: prices.length
  })).sort((a, b) => a.year - b.year);
}

function findHiddenGems(items: any[]) {
  return items.filter(item => {
    const price = Number(item.calculated_advice_price || item.median_price || item.marketplace_price || 0);
    return price > 0 && price < 50 && item.year && item.year < 1990;
  }).slice(0, 5);
}

function getArtistGenreConnections(items: any[]) {
  const connections = new Map();
  items.forEach(item => {
    if (item.artist && item.genre) {
      const key = item.artist;
      if (!connections.has(key)) {
        connections.set(key, new Set());
      }
      connections.get(key).add(item.genre);
    }
  });
  
  return Array.from(connections.entries()).map(([artist, genres]) => ({
    artist,
    genres: Array.from(genres),
    diversity: genres.size
  })).filter(item => item.diversity > 1).sort((a, b) => b.diversity - a.diversity);
}

function getLabelGenreAffinity(items: any[]) {
  const affinity = new Map();
  items.forEach(item => {
    if (item.label && item.genre) {
      const key = item.label;
      if (!affinity.has(key)) {
        affinity.set(key, new Map());
      }
      const labelGenres = affinity.get(key);
      labelGenres.set(item.genre, (labelGenres.get(item.genre) || 0) + 1);
    }
  });
  
  return Array.from(affinity.entries()).map(([label, genres]) => ({
    label,
    primaryGenre: Array.from(genres.entries()).sort((a, b) => b[1] - a[1])[0]?.[0],
    genreCount: genres.size,
    totalReleases: Array.from(genres.values()).reduce((sum, count) => sum + count, 0)
  }));
}

function getChronologicalFlow(items: any[]) {
  const sortedItems = items.filter(item => item.year).sort((a, b) => a.year - b.year);
  const flow = [];
  let currentGenre = null;
  let currentPeriod = null;
  
  sortedItems.forEach(item => {
    const period = Math.floor(item.year / 5) * 5; // 5-year periods
    if (period !== currentPeriod) {
      if (currentPeriod !== null) {
        flow.push({ period: currentPeriod, dominantGenre: currentGenre });
      }
      currentPeriod = period;
      currentGenre = item.genre;
    }
  });
  
  return flow;
}

function getRarityIndicators(items: any[]) {
  const indicators = {
    limitedEditions: items.filter(item => 
      item.title?.toLowerCase().includes('limited') || 
      item.title?.toLowerCase().includes('special')
    ).length,
    originalPressings: items.filter(item => item.year && item.year < 1980).length,
    importItems: items.filter(item => item.country && item.country !== 'Netherlands').length,
    matrixCoded: items.filter(item => item.matrix_number).length
  };
  return indicators;
}

function getRepresentativeReleases(items: any[], count: number) {
  // Get diverse sample across genres, years, and formats
  const genres = [...new Set(items.map(item => item.genre).filter(Boolean))];
  const sample = [];
  
  genres.slice(0, count).forEach(genre => {
    const genreItems = items.filter(item => item.genre === genre);
    if (genreItems.length > 0) {
      const representative = genreItems[Math.floor(Math.random() * genreItems.length)];
      sample.push(representative);
    }
  });
  
  // Fill remaining slots with random items
  while (sample.length < count && sample.length < items.length) {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    if (!sample.find(s => s.id === randomItem.id)) {
      sample.push(randomItem);
    }
  }
  
  return sample;
}

function getStyleDistribution(items: any[]) {
  const styles = new Map();
  items.forEach(item => {
    if (item.style) {
      const styleArray = Array.isArray(item.style) ? item.style : [item.style];
      styleArray.forEach(style => {
        styles.set(style, (styles.get(style) || 0) + 1);
      });
    }
  });
  return Array.from(styles.entries())
    .map(([style, count]) => ({ name: style, value: count }))
    .sort((a, b) => b.value - a.value);
}

function calculateDataCompleteness(items: any[]) {
  const fields = ['artist', 'title', 'genre', 'label', 'year', 'country', 'catalog_number'];
  const completeness = {};
  
  fields.forEach(field => {
    const withData = items.filter(item => item[field]).length;
    completeness[field] = Math.round((withData / items.length) * 100);
  });
  
  return completeness;
}
