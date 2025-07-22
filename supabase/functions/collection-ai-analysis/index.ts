
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to clean OpenAI response from markdown backticks
function cleanOpenAIResponse(content: string): string {
  if (!content) return content;
  
  // Remove markdown code block backticks and language identifier
  return content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// Function to safely parse JSON with fallback
function safeJsonParse(content: string): any {
  try {
    const cleanedContent = cleanOpenAIResponse(content);
    console.log('🧹 Cleaned content preview:', cleanedContent.substring(0, 200) + '...');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    console.error('📝 Raw content:', content.substring(0, 500));
    
    // Return fallback structure
    return {
      musicHistoryTimeline: {
        overview: "Er is een fout opgetreden bij het analyseren van je collectie, maar hier is een basale analyse beschikbaar.",
        keyPeriods: ["Je collectie toont een interessante mix van muziekperioden"],
        culturalMovements: ["Verschillende culturele invloeden zijn zichtbaar"],
        musicalEvolution: "Je collectie toont een evolutie door verschillende muziekstijlen heen"
      },
      artistStories: {
        legendaryFigures: ["Je collectie bevat enkele legendarische artiesten"],
        hiddenConnections: ["Er zijn interessante verbanden tussen de artiesten"],
        collaborationTales: ["Samenwerkingen tussen artiesten zijn zichtbaar"],
        artisticJourneys: ["De artistieke ontwikkeling is merkbaar"],
        crossGenreInfluences: ["Genre-overschrijdende invloeden zijn aanwezig"]
      },
      studioLegends: {
        legendaryStudios: ["Opnames uit bekende studio's"],
        iconicProducers: ["Werk van invloedrijke producers"],
        recordingInnovations: ["Technische vernieuwingen in opnames"],
        labelHistories: ["Geschiedenis van verschillende platenlabels"],
        soundEngineering: ["Bijzondere geluidstechnieken"]
      },
      culturalImpact: {
        societalInfluence: ["Maatschappelijke invloed van de muziek"],
        generationalMovements: ["Generatie-definiërende bewegingen"],
        politicalMessages: ["Politieke en sociale boodschappen"],
        fashionAndStyle: ["Invloed op mode en lifestyle"],
        globalReach: ["Internationale impact"]
      },
      musicalInnovations: {
        technicalBreakthroughs: ["Technische doorbraken"],
        genreCreation: ["Nieuwe genres en evoluties"],
        instrumentalPioneering: ["Innovatief instrumentgebruik"],
        vocalTechniques: ["Vernieuwende zangtechnieken"],
        productionMethods: ["Baanbrekende productietechnieken"]
      },
      hiddenGems: {
        underratedMasterpieces: ["Ondergewaardeerde meesterwerken"],
        rareFfinds: ["Zeldzame vondsten"],
        collectorSecrets: ["Collector's items"],
        sleepersHits: ["Latere klassiekers"],
        deepCuts: ["Verborgen pareltjes"]
      },
      musicalConnections: {
        genreEvolution: ["Genre-evoluties"],
        artistInfluences: ["Artistieke invloeden"],
        labelConnections: ["Label-verbindingen"],
        sceneConnections: ["Scene-connecties"],
        crossPollination: ["Kruisbestuiving tussen stijlen"]
      },
      technicalMastery: {
        soundQuality: "Variërende geluidskwaliteit door de collectie",
        formatSignificance: "Betekenis van verschillende formats",
        pressingQuality: "Verschillende persingskwaliteiten",
        artwork: "Iconische hoezen en artwork",
        packaging: "Bijzondere verpakkingen"
      },
      discoveryPaths: {
        nextExplorations: ["Suggesties voor verdere ontdekkingen"],
        relatedArtists: ["Aanverwante artiesten"],
        genreExpansions: ["Genre-uitbreidingen"],
        eraExplorations: ["Tijdperk-verkenningen"],
        labelDiveDeeps: ["Label-diepduiken"]
      }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting music-focused collection analysis...');
    
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
          musicHistoryTimeline: {
            overview: "Je hebt nog geen items in je collectie. Tijd om muzikale geschiedenis te verzamelen! 🎵",
            keyPeriods: [],
            culturalMovements: [],
            musicalEvolution: ""
          },
          artistStories: { legendaryFigures: [], hiddenConnections: [], collaborationTales: [], artisticJourneys: [], crossGenreInfluences: [] },
          studioLegends: { legendaryStudios: [], iconicProducers: [], recordingInnovations: [], labelHistories: [], soundEngineering: [] },
          culturalImpact: { societalInfluence: [], generationalMovements: [], politicalMessages: [], fashionAndStyle: [], globalReach: [] },
          musicalInnovations: { technicalBreakthroughs: [], genreCreation: [], instrumentalPioneering: [], vocalTechniques: [], productionMethods: [] },
          hiddenGems: { underratedMasterpieces: [], rareFfinds: [], collectorSecrets: [], sleepersHits: [], deepCuts: [] },
          musicalConnections: { genreEvolution: [], artistInfluences: [], labelConnections: [], sceneConnections: [], crossPollination: [] },
          technicalMastery: { soundQuality: "", formatSignificance: "", pressingQuality: "", artwork: "", packaging: "" },
          discoveryPaths: { nextExplorations: [], relatedArtists: [], genreExpansions: [], eraExplorations: [], labelDiveDeeps: [] }
        },
        stats: { totalItems: 0 },
        chartData: { genreDistribution: [], formatDistribution: [], topArtists: [] },
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare detailed collection statistics
    const uniqueArtists = new Set(allItems.map(item => item.artist)).size;
    const uniqueLabels = new Set(allItems.map(item => item.label)).size;
    const uniqueGenres = new Set(allItems.map(item => item.genre)).size;
    const decades = [...new Set(allItems.map(item => Math.floor((item.year || 0) / 10) * 10))].sort();
    const oldestItem = Math.min(...allItems.map(item => item.year || 9999));
    const newestItem = Math.max(...allItems.map(item => item.year || 0));
    
    // Calculate value statistics
    const itemsWithPrices = allItems.filter(item => item.calculated_advice_price);
    const totalValue = itemsWithPrices.reduce((sum, item) => sum + (item.calculated_advice_price || 0), 0);
    const avgValue = itemsWithPrices.length > 0 ? totalValue / itemsWithPrices.length : 0;

    // Create detailed artist and genre information
    const artistInfo = Array.from(
      allItems.reduce((acc, item) => {
        if (item.artist) {
          const current = acc.get(item.artist) || { count: 0, genres: new Set(), years: [], labels: new Set() };
          current.count++;
          if (item.genre) current.genres.add(item.genre);
          if (item.year) current.years.push(item.year);
          if (item.label) current.labels.add(item.label);
          acc.set(item.artist, current);
        }
        return acc;
      }, new Map())
    ).map(([artist, data]) => ({
      artist,
      albums: data.count,
      genres: Array.from(data.genres),
      yearSpan: data.years.length > 0 ? `${Math.min(...data.years)}-${Math.max(...data.years)}` : '',
      labels: Array.from(data.labels)
    }));

    // Enhanced music historian AI prompt
    const prompt = `Je bent een muziekhistoricus die diepgaand en fascinerend vertelt over deze collectie van ${allItems.length} albums!

COLLECTIE OVERZICHT:
- ${uniqueArtists} unieke artiesten uit ${uniqueGenres} verschillende genres
- Tijdspanne: ${oldestItem} tot ${newestItem} (${newestItem - oldestItem} jaar muziekgeschiedenis)
- ${uniqueLabels} verschillende platenlabels
- Formats: ${cdItems?.length || 0} CDs en ${vinylItems?.length || 0} vinyl platen
- Totale geschatte waarde: €${totalValue.toFixed(2)}

TOP ARTIESTEN IN DE COLLECTIE:
${artistInfo.slice(0, 15).map(a => `- ${a.artist}: ${a.albums} album(s), genres: ${a.genres.join(', ')}, periode: ${a.yearSpan}`).join('\n')}

BELANGRIJKSTE GENRES: ${[...new Set(allItems.map(item => item.genre))].slice(0, 8).join(', ')}

BELANGRIJKSTE LABELS: ${[...new Set(allItems.map(item => item.label))].slice(0, 8).join(', ')}

SAMPLE VAN ALBUMS:
${allItems.slice(0, 25).map(item => `- ${item.artist} - "${item.title}" (${item.year || '?'}, ${item.label || 'Unknown'}, ${item.genre || 'Unknown genre'})`).join('\n')}

INSTRUCTIES VOOR MUZIEKHISTORISCHE ANALYSE:
1. Analyseer deze collectie als een muziekhistoricus - focus op culturele context, muzikale innovaties en historische betekenis
2. Vertel verhalen over de artiesten, hun invloed op elkaar, en hoe ze de muziekgeschiedenis hebben gevormd
3. Leg verbanden tussen artiesten, genres, en tijdperioden
4. Beschrijf de culturele en maatschappelijke context waarin deze muziek ontstond
5. Highlight technische en artistieke innovaties in de collectie
6. Vertel over legendarische producers, studio's, en platenlabels
7. Wees informatief maar boeiend - vertel échte verhalen over de muziek

Return ALLEEN een geldig JSON object met deze exacte structuur (GEEN markdown backticks!):

{
  "musicHistoryTimeline": {
    "overview": "Een fascinerende reis door de muziekgeschiedenis via deze collectie",
    "keyPeriods": ["Beschrijvingen van belangrijke tijdperioden vertegenwoordigd in de collectie"],
    "culturalMovements": ["Belangrijke culturele bewegingen en hun impact"],
    "musicalEvolution": "Hoe de muziek evolueerde door de jaren heen in deze collectie"
  },
  "artistStories": {
    "legendaryFigures": ["Verhalen over de meest invloedrijke artiesten in de collectie"],
    "hiddenConnections": ["Fascinerende verbanden tussen artiesten"],
    "collaborationTales": ["Verhalen over samenwerkingen en wederzijdse invloeden"],
    "artisticJourneys": ["Evolutie van belangrijke artiesten door hun carrières"],
    "crossGenreInfluences": ["Hoe artiesten genres hebben overstegen en beïnvloed"]
  },
  "studioLegends": {
    "legendaryStudios": ["Verhalen over beroemde studio's waar albums zijn opgenomen"],
    "iconicProducers": ["Verhalen over producers en hun unieke sound"],
    "recordingInnovations": ["Technische doorbraken in de opnametechniek"],
    "labelHistories": ["Geschiedenis en betekenis van belangrijke platenlabels"],
    "soundEngineering": ["Bijzondere aspecten van geluidstechniek en productie"]
  },
  "culturalImpact": {
    "societalInfluence": ["Hoe deze albums de maatschappij hebben beïnvloed"],
    "generationalMovements": ["Muzikale bewegingen die generaties hebben gedefinieerd"],
    "politicalMessages": ["Politieke en sociale boodschappen in de muziek"],
    "fashionAndStyle": ["Invloed op mode, lifestyle en cultuur"],
    "globalReach": ["Internationale impact en cultuuruitwisseling"]
  },
  "musicalInnovations": {
    "technicalBreakthroughs": ["Technische vernieuwingen in instrumentatie en opname"],
    "genreCreation": ["Hoe nieuwe genres ontstonden of evolueerden"],
    "instrumentalPioneering": ["Innovatief gebruik van instrumenten"],
    "vocalTechniques": ["Vernieuwende zangtechnieken en stijlen"],
    "productionMethods": ["Baanbrekende productietechnieken"]
  },
  "hiddenGems": {
    "underratedMasterpieces": ["Ondergewaardeerde meesterwerken in de collectie"],
    "rareFfinds": ["Zeldzame uitgaven en hun verhalen"],
    "collectorSecrets": ["Insider-kennis over waardevolle items"],
    "sleepersHits": ["Albums die later erkend werden als klassiekers"],
    "deepCuts": ["Verborgen pareltjes die ontdekt moeten worden"]
  },
  "musicalConnections": {
    "genreEvolution": ["Hoe genres hebben geëvolueerd en elkaar beïnvloed"],
    "artistInfluences": ["Wie heeft wie beïnvloed in de muziekgeschiedenis"],
    "labelConnections": ["Verbanden tussen platenlabels en hun artists"],
    "sceneConnections": ["Lokale muziekscenes en hun wereldwijde invloed"],
    "crossPollination": ["Cultuuruitwisseling tussen verschillende muziekstromingen"]
  },
  "technicalMastery": {
    "soundQuality": "Analyse van de geluidskwaliteit en mastering in de collectie",
    "formatSignificance": "Betekenis van de verschillende formats (CD vs vinyl)",
    "pressingQuality": "Bijzonderheden over persingen en hun kwaliteit",
    "artwork": "Iconische hoezen en hun artistieke betekenis",
    "packaging": "Bijzondere verpakkingen en hun collectorswaarde"
  },
  "discoveryPaths": {
    "nextExplorations": ["Suggesties voor verdere muzikale ontdekkingen"],
    "relatedArtists": ["Aanverwante artiesten om te ontdekken"],
    "genreExpansions": ["Genres om verder te verkennen"],
    "eraExplorations": ["Tijdperioden om dieper in te duiken"],
    "labelDiveDeeps": ["Platenlabels om verder te onderzoeken"]
  }
}`;

    console.log('🤖 Calling OpenAI with music historian prompt...');

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
            content: 'Je bent een gepassioneerde muziekhistoricus die fascinerende verhalen vertelt over muziek, artiesten en hun culturele impact. Je bent informatief maar nooit droog, en altijd gericht op de verhalen achter de muziek. Return ALTIJD pure JSON zonder markdown backticks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('🤖 Raw OpenAI response received, length:', openAIData.choices[0].message.content.length);
    
    // Use safe JSON parsing with fallback
    const aiAnalysis = safeJsonParse(openAIData.choices[0].message.content);
    
    // Prepare enhanced chart data
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
      { name: "CD", value: cdItems?.length || 0, fill: "#8B5CF6" },
      { name: "Vinyl", value: vinylItems?.length || 0, fill: "#A78BFA" }
    ].filter(item => item.value > 0);

    const topArtists = artistInfo
      .sort((a, b) => b.albums - a.albums)
      .slice(0, 15)
      .map(({ artist, albums, genres }) => ({ name: artist, albums, genres: genres.slice(0, 3) }));

    // Calculate decade distribution with cultural context
    const decadeDistribution = decades.map(decade => {
      const items = allItems.filter(item => Math.floor((item.year || 0) / 10) * 10 === decade);
      return {
        decade: `${decade}s`,
        count: items.length,
        genres: new Set(items.map(item => item.genre)).size,
        artists: new Set(items.map(item => item.artist)).size,
        percentage: Math.round((items.length / allItems.length) * 100)
      };
    });

    // Label influence analysis
    const labelAnalysis = Array.from(
      allItems.reduce((acc, item) => {
        if (item.label) {
          const current = acc.get(item.label) || { count: 0, artists: new Set(), genres: new Set() };
          current.count++;
          if (item.artist) current.artists.add(item.artist);
          if (item.genre) current.genres.add(item.genre);
          acc.set(item.label, current);
        }
        return acc;
      }, new Map())
    ).map(([label, data]) => ({
      label,
      releases: data.count,
      artists: data.artists.size,
      genres: data.genres.size,
      diversity: Math.round((data.genres.size / data.count) * 100)
    })).sort((a, b) => b.releases - a.releases).slice(0, 10);

    console.log('✅ Music history analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      stats: {
        totalItems: allItems.length,
        uniqueArtists,
        uniqueLabels,
        uniqueGenres,
        oldestItem,
        newestItem,
        totalValue,
        avgValue,
        itemsWithPricing: itemsWithPrices.length,
        timeSpan: newestItem - oldestItem,
        cdCount: cdItems?.length || 0,
        vinylCount: vinylItems?.length || 0
      },
      chartData: {
        genreDistribution,
        formatDistribution,
        topArtists,
        decadeDistribution,
        labelAnalysis,
        artistConnections: artistInfo.slice(0, 20)
      },
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Music history analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
