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
      priceStats: calculatePriceStats(allItems),
      priceEvolution: getPriceEvolution(allItems),
      vintageItems: allItems.filter(item => item.year && item.year < 1980),
      modernItems: allItems.filter(item => item.year && item.year > 2000),
      mostValuable: getMostValuable(allItems, 8),
      hiddenGems: findHiddenGems(allItems),
      
      // Collection coherence and patterns
      artistGenreConnections: getArtistGenreConnections(allItems),
      labelGenreAffinity: getLabelGenreAffinity(allItems),
      chronologicalFlow: getChronologicalFlow(allItems),
      rarityIndicators: getRarityIndicators(allItems),
      
      // Sample releases for AI context
      representativeReleases: getRepresentativeReleases(allItems, 10)
    };

    // Create comprehensive AI analysis prompt with rich context
    const analysisPrompt = `Je bent een expert muziekhistoricus, verzamelaar en muziekindustrie-analist die een persoonlijke muziekcollectie analyseert. Gebruik alle beschikbare metadata om een diepgaande, betekenisvolle analyse te maken.

GEDETAILLEERDE COLLECTIE DATA:

Basis Overzicht:
- Totaal: ${detailedAnalysis.totalItems} items (${detailedAnalysis.totalCDs} CDs, ${detailedAnalysis.totalVinyls} Vinyls)
- Jaar Range: ${detailedAnalysis.years[0]} - ${detailedAnalysis.years[detailedAnalysis.years.length - 1]}
- Landen: ${detailedAnalysis.countries.join(', ')}

Genre Ecosysteem:
- Hoofd Genres: ${detailedAnalysis.genres.slice(0, 12).join(', ')}
- Stijlen: ${detailedAnalysis.styles.slice(0, 20).join(', ')}
- Genre Diepte: ${detailedAnalysis.genreStyleMatrix.length} unieke genre-stijl combinaties

Artiest Landschap:
- Top Artiesten: ${detailedAnalysis.topArtists.map(a => `${a.name} (${a.count} releases)`).join(', ')}
- Artiest Types: ${detailedAnalysis.soloVsBands.solo} solo artiesten, ${detailedAnalysis.soloVsBands.bands} bands
- Tijdsspanne per Artiest: Toont evolutie door de jaren

Label Ecosysteem:
- Prominente Labels: ${detailedAnalysis.topLabels.map(l => `${l.name} (${l.count})`).join(', ')}
- Label Categorieën: ${detailedAnalysis.independentVsMajor.independent} independent, ${detailedAnalysis.independentVsMajor.major} major labels

Markt & Investment Analyse:
${detailedAnalysis.priceStats ? `
- Totale Waarde: €${Math.round(detailedAnalysis.priceStats.total)}
- Gemiddelde Waarde: €${Math.round(detailedAnalysis.priceStats.average)}
- Duurste Item: €${Math.round(detailedAnalysis.priceStats.max)}
- Waardevolle Items: ${detailedAnalysis.mostValuable.map(v => `${v.artist} - ${v.title} (€${Math.round(v.price)})`).join(', ')}
` : '- Prijsdata beperkt beschikbaar'}

Representatieve Releases (Context Voorbeelden):
${detailedAnalysis.representativeReleases.map(r => 
  `• ${r.artist} - "${r.title}" (${r.year}) [${r.label || 'Unknown Label'}] ${r.catalog_number ? `Cat: ${r.catalog_number}` : ''} ${r.genre ? `Genre: ${r.genre}` : ''}`
).join('\n')}

Technische Details:
- Catalog Nummering: ${detailedAnalysis.catalogNumbers.patterns.length} unieke patronen
- Matrix Codes: ${detailedAnalysis.matrixNumbers.total} items met matrix nummers
- Conditie Spreiding: ${Object.entries(detailedAnalysis.conditions).map(([k,v]) => `${k}: ${v}`).join(', ')}

SPECIFIEKE ANALYSE OPDRACHT:
Analyseer deze collectie als een muziekhistoricus en geef concrete, specifieke inzichten. Focus op:
1. Label geschiedenis en connecties tussen labels
2. Producer/engineer patronen (waar detecteerbaar uit matrix codes/catalog nummers)
3. Studio geografie en opname locaties
4. Genre evolutie en cross-pollination binnen de collectie
5. Nederlandse vs internationale releases - culturele context
6. Zeldzaamheid indicatoren en pressing details
7. Investment potentieel en markt trends
8. Chronologische verhaal van muziektaste evolutie

Wees SPECIFIEK en CONCREET - geen algemene observaties. Gebruik de exacte data om patronen te ontdekken.

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

    // Prepare enhanced chart data with better coverage
    const chartData = {
      genreDistribution: detailedAnalysis.topGenres.filter(g => g.name).map(genre => ({
        name: genre.name,
        value: genre.count,
        percentage: Math.round((genre.count / allItems.length) * 100)
      })),
      formatDistribution: [
        { name: 'CD', value: detailedAnalysis.totalCDs, fill: 'hsl(var(--vinyl-purple))' },
        { name: 'Vinyl', value: detailedAnalysis.totalVinyls, fill: 'hsl(var(--vinyl-gold))' }
      ],
      topArtists: detailedAnalysis.topArtists.slice(0, 10).map(artist => ({
        name: artist.name && artist.name.length > 15 ? artist.name.substring(0, 15) + '...' : artist.name || 'Unknown Artist',
        albums: artist.count
      })),
      yearDistribution: getYearDistribution(allItems),
      labelDistribution: detailedAnalysis.topLabels.filter(l => l.name).slice(0, 8).map(label => ({
        name: label.name.length > 12 ? label.name.substring(0, 12) + '...' : label.name,
        releases: label.count
      })),
      valueDistribution: getValueDistribution(allItems),
      countryDistribution: getCountryDistribution(allItems).slice(0, 8),
      styleDistribution: getStyleDistribution(allItems).slice(0, 10),
      decadeFlow: detailedAnalysis.decadeAnalysis
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
        dataCompleteness: calculateDataCompleteness(allItems)
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