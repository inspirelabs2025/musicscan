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

// Function to safely parse JSON with intelligent fallback
function safeJsonParse(content: string, collectionData: any = {}): any {
  try {
    const cleanedContent = cleanOpenAIResponse(content);
    console.log('🧹 Cleaned content preview:', cleanedContent.substring(0, 200) + '...');
    
    // Try to parse the full JSON
    const parsed = JSON.parse(cleanedContent);
    console.log('✅ Successfully parsed complete JSON response');
    return parsed;
  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    console.error('📝 Raw content preview:', content.substring(0, 800));
    
    // Try to extract partial JSON if content exists
    if (content && content.length > 100) {
      try {
        // Look for JSON-like structure and try to complete it
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          let partialJson = content.substring(jsonStart, jsonEnd + 1);
          
          // Try to fix common JSON issues
          partialJson = partialJson
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
            .replace(/}\s*{/g, '},{'); // Fix missing commas between objects
          
          const partialParsed = JSON.parse(partialJson);
          console.log('⚠️ Using partial JSON parsing - some data may be incomplete');
          return partialParsed;
        }
      } catch (partialError) {
        console.error('❌ Partial JSON parsing also failed:', partialError.message);
      }
    }
    
    // Generate intelligent fallback based on actual collection data
    const { uniqueArtists = 0, uniqueGenres = 0, totalItems = 0, topArtists = [], topGenres = [] } = collectionData;
    
    return {
      musicHistoryTimeline: {
        overview: `Je collectie van ${totalItems} albums vertegenwoordigt ${uniqueArtists} artiesten en ${uniqueGenres} genres - een rijke muzikale reis door de tijd.`,
        keyPeriods: [
          "Je collectie omvat meerdere belangrijke perioden in de muziekgeschiedenis",
          "Van klassieke opnamen tot moderne releases - elk tijdperk heeft zijn eigen verhaal",
          "De evolutie van geluidstechnologie is hoorbaar door je collectie heen"
        ],
        culturalMovements: [
          "Verschillende culturele bewegingen hebben hun sporen achtergelaten in je collectie",
          "Van underground scenes tot mainstream doorbraken - alle verhalen zijn vertegenwoordigd",
          "Internationale invloeden tonen de mondiale kracht van muziek"
        ],
        musicalEvolution: "Je collectie toont een fascinerende evolutie van muziekstijlen, productietechnieken en artistieke uitdrukkingen door de decennia heen."
      },
      artistStories: {
        legendaryFigures: topArtists.slice(0, 5).map(artist => `${artist.name || artist} - een invloedrijke kracht in de muziekgeschiedenis`),
        hiddenConnections: [
          "Artiesten in je collectie hebben elkaar beïnvloed in onverwachte manieren",
          "Producers en muzikanten hebben samengewerkt over genregrenzen heen",
          "Verborgen samenwerkingen en mutual influences vormen een web van creativiteit"
        ],
        collaborationTales: [
          "Je collectie bevat verhalen van baanbrekende samenwerkingen",
          "Studio-sessies waar legendes elkaar ontmoetten",
          "Gastoptredens die muziekgeschiedenis hebben geschreven"
        ],
        artisticJourneys: [
          "De evolutie van artiesten is hoorbaar door hun verschillende albumreleases",
          "Van experimentele beginnen tot gepolijste meesterwerken",
          "Persoonlijke groei vertaald naar muzikale innovatie"
        ],
        crossGenreInfluences: [
          "Genre-overschrijdende experimenten hebben nieuwe sounds gecreëerd",
          "Traditionele grenzen werden doorbroken voor artistieke vrijheid",
          "Fusion van stijlen heeft geleid tot onverwachte muzikale pareltjes"
        ]
      },
      studioLegends: {
        legendaryStudios: [
          "Albums in je collectie zijn opgenomen in iconische studio's wereldwijd",
          "Legendarische locaties waar muziekgeschiedenis werd gemaakt",
          "Studio-atmosfeer heeft bijgedragen aan de unieke sound van albums"
        ],
        iconicProducers: [
          "Invloedrijke producers hebben hun stempel gedrukt op je collectie",
          "Visionaire geluidsarchitecten achter tijdloze opnames",
          "Productietechnieken die de sound van tijdperken hebben gedefinieerd"
        ],
        recordingInnovations: [
          "Technische doorbraken in opname- en mixingtechnieken",
          "Experimentele geluidstechnieken die nieuwe standaarden zetten",
          "Van analoge warmte tot digitale precisie - alle evoluties zijn vertegenwoordigd"
        ],
        labelHistories: [
          "Platenlabels in je collectie hebben elk hun eigen verhaal en filosofie",
          "Independent labels versus major companies - verschillende benaderingen van muziek",
          "Label-identiteit die de artistieke richting van releases heeft beïnvloed"
        ],
        soundEngineering: [
          "Masterful engineering heeft de geluidskwaliteit van je albums bepaald",
          "Balans tussen artistieke visie en technische perfectie",
          "Sound design dat de emotionele impact van muziek versterkt"
        ]
      },
      culturalImpact: {
        societalInfluence: [
          "Albums in je collectie hebben maatschappelijke discussies aangezwengeld",
          "Muziek als spiegel van tijdsgeest en sociale bewegingen",
          "Artistieke uitdrukkingen die generaties hebben geïnspireerd"
        ],
        generationalMovements: [
          "Je collectie vertegenwoordigt muziek die generaties heeft gedefinieerd",
          "Soundtrack van jeugd, rebellie en culturele verandering",
          "Tijdloze albums die blijven resoneren met nieuwe luisteraars"
        ],
        politicalMessages: [
          "Protest songs en politieke statements weven zich door je collectie",
          "Muziek als medium voor sociale kritiek en verandering",
          "Artistieke vrijheid in tijden van censuur en controle"
        ],
        fashionAndStyle: [
          "Mode en lifestyle trends beïnvloed door artiesten in je collectie",
          "Iconische looks die de visuele cultuur hebben gevormd",
          "Stijl als uitbreiding van muzikale identiteit"
        ],
        globalReach: [
          "Internationale muzikale uitwisseling vertegenwoordigd in je collectie",
          "Lokale sounds die wereldwijde erkenning hebben gevonden",
          "Cultuuruitwisseling door muzikale collaboraties"
        ]
      },
      musicalInnovations: {
        technicalBreakthroughs: [
          "Baanbrekende gebruik van instrumenten en technologie",
          "Synthesizers, sampling en digitale revoluties",
          "Experimentele sound design en audio processing"
        ],
        genreCreation: [
          "Nieuwe genres geboren uit creativiteit en experimentatie",
          "Fusion van verschillende muzikale tradities",
          "Evolutie van bestaande stijlen naar nieuwe uitdrukkingsvormen"
        ],
        instrumentalPioneering: [
          "Innovatief gebruik van traditionele en elektronische instrumenten",
          "Extended techniques en onconventionele speelstijlen",
          "Instrumentale virtuositeit gecombineerd met creatieve visie"
        ],
        vocalTechniques: [
          "Revolutionaire zangtechnieken en vocale stijlen",
          "Van operatische training tot experimentele vocalizations",
          "Stem als instrument voor emotionele en artistieke expressie"
        ],
        productionMethods: [
          "Innovatieve productiebenaderingen die nieuwe sounds hebben gecreëerd",
          "Gebruik van onconventionele recording technieken",
          "Balans tussen perfectie en spontane creativiteit"
        ]
      },
      hiddenGems: {
        underratedMasterpieces: [
          "Ondergewaardeerde albums die herontdekking verdienen",
          "Perfecte albums die door mainstream aandacht zijn gemist",
          "Tijdloze kwaliteit die wacht op erkenning"
        ],
        rareFfinds: [
          "Zeldzame pressings en limited editions in je collectie",
          "Moeilijk vindbare releases met bijzondere verhalen",
          "Collector's items met historische of artistieke waarde"
        ],
        collectorSecrets: [
          "Insider kennis over waardevolle en betekenisvolle releases",
          "Verhalen achter de productie en distributie van albums",
          "Details die alleen echte muziekliefhebbers waarderen"
        ],
        sleepersHits: [
          "Albums die aanvankelijk werden genegeerd maar later werden erkend",
          "Slow-burning classics die hun publiek geleidelijk vonden",
          "Invloedrijke releases die pas jaren later werden gewaardeerd"
        ],
        deepCuts: [
          "Verborgen tracks en B-sides die ontdekking waard zijn",
          "Minder bekende songs die de artistieke diepte tonen",
          "Muzikale pareltjes die wachten op herontdekking"
        ]
      },
      musicalConnections: {
        genreEvolution: [
          "Ontwikkeling van muziekstijlen door je collectie heen",
          "Invloeden tussen verschillende genres en tijdperken",
          "Evolutionaire stappen in muzikale expressie"
        ],
        artistInfluences: [
          "Netwerk van wederzijdse beïnvloeding tussen artiesten",
          "Mentorships en collaboraties die carrières hebben gevormd",
          "Generatie-overschrijdende artistieke uitwisseling"
        ],
        labelConnections: [
          "Verbindingen tussen platenlabels en hun artistieke filosofieën",
          "A&R relaties die bijzondere releases mogelijk maakten",
          "Label-identiteit die de sound van releases heeft beïnvloed"
        ],
        sceneConnections: [
          "Lokale muziekscenes vertegenwoordigd in je collectie",
          "Geografische en culturele invloeden op sound",
          "Scene-politics en underground movements"
        ],
        crossPollination: [
          "Cultuuruitwisseling tussen verschillende muziekstromingen",
          "Internationale samenwerkingen en invloeden",
          "Fusion van tradities uit verschillende delen van de wereld"
        ]
      },
      technicalMastery: {
        soundQuality: "Je collectie toont de evolutie van opname- en masteringtechnieken, van vintage warmte tot moderne precisie.",
        formatSignificance: "Verschillende formats (vinyl vs CD) bieden unieke luisterervaringen en hebben hun eigen charme en karakter.",
        pressingQuality: "Variërende persinkwaliteiten vertellen het verhaal van verschillende tijdperken en productiestandaarden.",
        artwork: "Album hoezen in je collectie vertegenwoordigen iconische visuele kunstwerken die de muziek perfect aanvullen.",
        packaging: "Van standaard hoezen tot elaborate packaging - elk album vertelt ook visueel zijn verhaal."
      },
      discoveryPaths: {
        nextExplorations: [
          "Verken meer werk van je favoriete artiesten uit de collectie",
          "Duik dieper in specifieke genres die je interesseren",
          "Ontdek contemporaries van artiesten die je al hebt"
        ],
        relatedArtists: topArtists.slice(0, 3).map(artist => `Verken meer van ${artist.name || artist} en vergelijkbare artiesten`),
        genreExpansions: topGenres.slice(0, 3).map(genre => `Verdiep je kennis van ${genre} en verwante stijlen`),
        eraExplorations: [
          "Ontdek meer albums uit je favoriete muzikale tijdperken",
          "Verken de context van je historische releases",
          "Duik in de verhalen achter klassieke albums"
        ],
        labelDiveDeeps: [
          "Onderzoek de complete catalogi van je favoriete labels",
          "Ontdek de filosofie en artistieke visie achter platenlabels",
          "Verken label-compilaties en rarities"
        ]
      }
    };
  }
}

// Normalization helpers for consistent counting
const normalizeString = (s: string | null | undefined) => {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\s+/g, ' ')
    .trim();
};

const extractArtists = (s: string): string[] => {
  if (!s) return [];
  // Remove '(feat. ...)' blocks and anything after 'feat.' style markers
  let cleaned = s.replace(/\((feat\.|featuring)[^)]+\)/gi, '')
                 .replace(/feat\.|featuring.*/gi, '');
  // Split on common separators
  const parts = cleaned.split(/,|\&|\s+x\s+|\s+with\s+|\s*\/\s*/i)
    .map(part => normalizeString(part))
    .filter(Boolean);
  return parts.length ? parts : [normalizeString(cleaned)];
};

const normalizeGenre = (g: string | null | undefined) => normalizeString(g);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting comprehensive music analysis (collection + Spotify)...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from request
    const { user_id, language: reqLanguage } = await req.json().catch(() => ({}));
    const language = reqLanguage || 'nl';
    const isEnglish = language === 'en';
    const authHeader = req.headers.get('Authorization');
    
    let userId = user_id;
    if (!userId && authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        userId = user?.id;
      } catch (e) {
        console.log('Could not get user from token, proceeding with public analysis');
      }
    }

    // Fetch all collection data including AI scan results
    const cdQuery = supabaseClient.from('cd_scan').select('*');
    const vinylQuery = supabaseClient.from('vinyl2_scan').select('*');
    const aiQuery = supabaseClient.from('ai_scan_results').select('*');
    
    if (userId) {
      cdQuery.eq('user_id', userId);
      vinylQuery.eq('user_id', userId);
      aiQuery.eq('user_id', userId);
    }

    const [cdResult, vinylResult, aiResult] = await Promise.all([
      cdQuery,
      vinylQuery,
      aiQuery
    ]);

    const { data: cdItems, error: cdError } = cdResult;
    const { data: vinylItems, error: vinylError } = vinylResult;
    const { data: aiItems, error: aiError } = aiResult;

    if (cdError) console.error('CD Database error:', cdError);
    if (vinylError) console.error('Vinyl Database error:', vinylError);
    if (aiError) console.error('AI Database error:', aiError);

    // Filter AI scans to only include completed ones with valid data
    const completedAiItems = (aiItems || []).filter(item => 
      item.status === 'completed' && 
      item.artist && 
      item.title && 
      item.calculated_advice_price !== null
    );

    // Fetch Spotify data if user is available
    let spotifyTracks = [];
    let spotifyPlaylists = [];
    let spotifyStats = [];
    
    if (userId) {
      try {
        const [tracksResult, playlistsResult, statsResult] = await Promise.all([
          supabaseClient.from('spotify_tracks').select('*').eq('user_id', userId),
          supabaseClient.from('spotify_playlists').select('*').eq('user_id', userId),
          supabaseClient.from('spotify_user_stats').select('*').eq('user_id', userId)
        ]);
        
        spotifyTracks = tracksResult.data || [];
        spotifyPlaylists = playlistsResult.data || [];
        spotifyStats = statsResult.data || [];
        
        console.log(`🎧 Found ${spotifyTracks.length} Spotify tracks, ${spotifyPlaylists.length} playlists, ${spotifyStats.length} stats`);
      } catch (error) {
        console.log('Could not fetch Spotify data:', error);
      }
    }

    const allItems = [
      ...(cdItems || []).map(item => ({ ...item, source: 'cd_scan', media_type: 'cd' })),
      ...(vinylItems || []).map(item => ({ ...item, source: 'vinyl2_scan', media_type: 'vinyl' })),
      ...completedAiItems.map(item => ({ ...item, source: 'ai_scan_results', media_type: item.media_type || 'unknown' }))
    ];

    console.log(`📊 Analyzing ${allItems.length} items (${cdItems?.length || 0} CDs, ${vinylItems?.length || 0} vinyl, ${completedAiItems.length} AI scans) + ${spotifyTracks.length} Spotify tracks`);

    // Check if we have any data to analyze
    const hasPhysicalCollection = allItems && allItems.length > 0;
    const hasSpotifyData = spotifyTracks && spotifyTracks.length > 0;

    if (!hasPhysicalCollection && !hasSpotifyData) {
      console.warn('No collection items or Spotify data found');
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          musicHistoryTimeline: {
            overview: isEnglish ? "You don't have any items in your collection or Spotify data yet. Time to start collecting music history! 🎵" : "Je hebt nog geen items in je collectie en geen Spotify data. Tijd om muzikale geschiedenis te verzamelen! 🎵",
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
        stats: { 
          totalItems: 0, 
          spotifyTracks: 0,
          spotifyPlaylists: 0,
          hasPhysicalCollection: false,
          hasSpotifyData: false,
          physicalArtistsCount: 0,
          spotifyArtistsCount: 0
        },
        chartData: { genreDistribution: [], formatDistribution: [], topArtists: [] },
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare detailed collection statistics combining physical and Spotify data
    const physicalArtistSet = new Set<string>();
    allItems.forEach(item => {
      if (item.artist) {
        extractArtists(item.artist).forEach(a => physicalArtistSet.add(a));
      }
    });

    const spotifyArtistSet = new Set<string>();
    spotifyTracks.forEach(track => {
      if (track.artist) {
        extractArtists(track.artist).forEach(a => spotifyArtistSet.add(a));
      }
    });

    const allArtistSet = new Set<string>([...physicalArtistSet, ...spotifyArtistSet]);
    
    const physicalGenresSet = new Set<string>();
    allItems.forEach(item => { if (item.genre) physicalGenresSet.add(normalizeGenre(item.genre)); });
    const spotifyGenresSet = new Set<string>();
    spotifyTracks.forEach(track => { if (track.genre) spotifyGenresSet.add(normalizeGenre(track.genre)); });
    const allGenresSet = new Set<string>([...physicalGenresSet, ...spotifyGenresSet]);
    
    const uniqueArtists = allArtistSet.size;
    const uniqueLabels = new Set(allItems.map(item => normalizeString(item.label || '')).filter(Boolean)).size;
    const uniqueGenres = allGenresSet.size;
    const decades = [...new Set(allItems.map(item => Math.floor((item.year || 0) / 10) * 10))].sort();
    const oldestItem = Math.min(...allItems.map(item => item.year || 9999));
    const newestItem = Math.max(...allItems.map(item => item.year || 0));
    
    // Calculate value statistics
    const itemsWithPrices = allItems.filter(item => item.calculated_advice_price);
    const totalValue = itemsWithPrices.reduce((sum, item) => sum + (item.calculated_advice_price || 0), 0);
    const avgValue = itemsWithPrices.length > 0 ? totalValue / itemsWithPrices.length : 0;

    // Create detailed artist and genre information (normalized keys)
    const artistInfo = Array.from(
      allItems.reduce((acc, item) => {
        if (item.artist) {
          const names = extractArtists(item.artist);
          names.forEach((name) => {
            const current = acc.get(name) || { display: item.artist, count: 0, genres: new Set<string>(), years: [] as number[], labels: new Set<string>() };
            current.count++;
            if (item.genre) current.genres.add(normalizeGenre(item.genre));
            if (item.year) current.years.push(item.year);
            if (item.label) current.labels.add(item.label);
            acc.set(name, current);
          });
        }
        return acc;
      }, new Map<string, { display: string; count: number; genres: Set<string>; years: number[]; labels: Set<string>; }>())
    ).map(([key, data]) => ({
      artist: data.display?.split(',')[0] || key,
      albums: data.count,
      genres: Array.from(data.genres),
      yearSpan: data.years.length > 0 ? `${Math.min(...data.years)}-${Math.max(...data.years)}` : '',
      labels: Array.from(data.labels)
    }));

    // Process Spotify data for analysis
    const spotifyArtistCounts = spotifyTracks.reduce((acc, track) => {
      if (track.artist) {
        acc[track.artist] = (acc[track.artist] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topSpotifyArtists = Object.entries(spotifyArtistCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([artist, count]) => ({ artist, tracks: count }));

    const spotifyGenreCounts = spotifyTracks.reduce((acc, track) => {
      if (track.genre) {
        acc[track.genre] = (acc[track.genre] || 0) + 1;
      }
      return acc;
    }, {});

    // Enhanced music historian AI prompt with Spotify integration
    const langInstruction = isEnglish 
      ? 'You are a music historian providing deep, fascinating insights. Respond in English.'
      : 'Je bent een muziekhistoricus die diepgaand en fascinerend vertelt. Antwoord in het Nederlands.';
    
    let prompt = isEnglish 
      ? `You are a music historian providing deep and fascinating insights about this complete music profile!\n\nCOMPLETE MUSIC PROFILE:`
      : `Je bent een muziekhistoricus die diepgaand en fascinerend vertelt over dit complete muziekprofiel!\n\nCOMPLETE MUZIEKPROFIEL:`;

    if (hasPhysicalCollection) {
      prompt += `

FYSIEKE COLLECTIE (${allItems.length} albums):
- Tijdspanne: ${oldestItem} tot ${newestItem} (${newestItem - oldestItem} jaar muziekgeschiedenis)
- ${uniqueLabels} verschillende platenlabels
- Formats: ${cdItems?.length || 0} CDs, ${vinylItems?.length || 0} vinyl platen, ${completedAiItems.length} AI gescande items
- Totale geschatte waarde: €${totalValue.toFixed(2)}

TOP ARTIESTEN IN FYSIEKE COLLECTIE:
${artistInfo.slice(0, 10).map(a => `- ${a.artist}: ${a.albums} album(s), genres: ${a.genres.join(', ')}, periode: ${a.yearSpan}`).join('\n')}`;
    }

    if (hasSpotifyData) {
      prompt += `

SPOTIFY LUISTERGEDRAG (${spotifyTracks.length} tracks):
- Totaal unieke artiesten: ${spotifyArtistSet.size}
- Playlists: ${spotifyPlaylists.length}

TOP SPOTIFY ARTIESTEN:
${topSpotifyArtists.slice(0, 10).map(a => `- ${a.artist}: ${a.tracks} tracks`).join('\n')}`;
    }

    prompt += `

GECOMBINEERD OVERZICHT:
- ${uniqueArtists} totaal unieke artiesten uit ${uniqueGenres} verschillende genres`;

    if (hasPhysicalCollection && hasSpotifyData) {
      // Find artists in both physical and digital
      const commonArtists = [...physicalArtistSet].filter(artist => spotifyArtistSet.has(artist));
      const physicalOnlyArtists = [...physicalArtistSet].filter(artist => !spotifyArtistSet.has(artist));
      const spotifyOnlyArtists = [...spotifyArtistSet].filter(artist => !physicalArtistSet.has(artist));
      
      prompt += `
- ${commonArtists.length} artiesten komen voor in BEIDE collectie en Spotify
- ${physicalOnlyArtists.length} artiesten ALLEEN in fysieke collectie
- ${spotifyOnlyArtists.length} artiesten ALLEEN op Spotify

VERGELIJKENDE ANALYSE:
Deze persoon heeft interessante verschillen tussen fysiek bezit en digitaal luisteren. 
Analyseer de verschillen tussen fysieke collectie voorkeur en Spotify luistergedrag.`;
    }

    const analysisInstruction = isEnglish
      ? `\n\nANALYSIS TASK:\nCreate a rich, in-depth music personality analysis combining both physical collection and digital listening behavior.\n${hasPhysicalCollection && hasSpotifyData ? 
        'Focus on the fascinating comparison between what they OWN vs what they LISTEN to. Why do they physically collect certain artists but listen digitally to others?' : 
        hasPhysicalCollection ? 
        'Focus on curatorial choices and the significance of physical music ownership.' :
        'Focus on listening patterns and digital music discovery.'}\n\nProvide a COMPLETE JSON response with English text in this exact structure:`
      : `\n\nANALYSE OPDRACHT:\nCreeer een rijke, diepgaande muziekpersoonlijkheidsanalyse die zowel fysieke collectie als digitaal luistergedrag combineert.\n${hasPhysicalCollection && hasSpotifyData ? 
        'Focus op de fascinerende vergelijking tussen wat ze BEZITTEN vs wat ze LUISTEREN. Waarom verzamelen ze bepaalde artiesten fysiek maar luisteren ze digitaal naar anderen?' : 
        hasPhysicalCollection ? 
        'Focus op de curatoriale keuzes en de betekenis van fysiek muziekbezit.' :
        'Focus op luisterpatronen en digitale muziekontdekking.'}\n\nGeef een COMPLETE JSON response met Nederlandse tekst in deze exacte structuur:`;

    prompt += analysisInstruction;

    // JSON structure template (field names stay the same, descriptions match language)
    const jsonDescriptions = isEnglish ? {
      overview: "A fascinating journey through music history via this collection",
      keyPeriods: "Descriptions of important time periods represented in the collection",
      culturalMovements: "Important cultural movements and their impact",
      musicalEvolution: "How music evolved through the years in this collection",
      legendaryFigures: "Stories about the most influential artists in the collection",
      hiddenConnections: "Fascinating connections between artists",
      collaborationTales: "Stories about collaborations and mutual influences",
      artisticJourneys: "Evolution of important artists through their careers",
      crossGenreInfluences: "How artists transcended and influenced genres",
      legendaryStudios: "Stories about famous studios where albums were recorded",
      iconicProducers: "Stories about producers and their unique sound",
      recordingInnovations: "Technical breakthroughs in recording technology",
      labelHistories: "History and significance of important record labels",
      soundEngineering: "Special aspects of sound engineering and production",
      societalInfluence: "How these albums influenced society",
      generationalMovements: "Musical movements that defined generations",
      politicalMessages: "Political and social messages in the music",
      fashionAndStyle: "Influence on fashion, lifestyle and culture",
      globalReach: "International impact and cultural exchange",
      technicalBreakthroughs: "Technical innovations in instrumentation and recording",
      genreCreation: "New genres that emerged from these movements",
      instrumentalPioneering: "Innovative use of instruments",
      vocalTechniques: "Special vocal techniques and styles",
      productionMethods: "Groundbreaking production methods",
      underratedMasterpieces: "Underrated gems in the collection",
      rareFfinds: "Rare finds and special editions",
      collectorSecrets: "Insider tips for collectors",
      sleepersHits: "Albums that were later recognized as classics",
      deepCuts: "Hidden tracks and B-sides worth discovering",
      genreEvolution: "How genres evolved and influenced each other",
      artistInfluences: "Mutual influence between artists",
      labelConnections: "Connections between record labels and their sound",
      sceneConnections: "Local scenes and their international impact",
      crossPollination: "Cultural exchange and genre blending",
      soundQuality: "Analysis of sound quality and recording techniques",
      formatSignificance: "Significance of different formats (vinyl vs CD)",
      pressingQuality: "Quality of different pressings and editions",
      artwork: "Iconic album covers and visual aspects",
      packaging: "Special packaging and limited editions",
      nextExplorations: "Suggestions for further exploration",
      relatedArtists: "Related artists to discover",
      genreExpansions: "Genres to explore further",
      eraExplorations: "Eras to learn more about",
      labelDiveDeeps: "Labels with interesting catalogs to explore"
    } : {
      overview: "Een fascinerende reis door de muziekgeschiedenis via deze collectie",
      keyPeriods: "Beschrijvingen van belangrijke tijdperioden vertegenwoordigd in de collectie",
      culturalMovements: "Belangrijke culturele bewegingen en hun impact",
      musicalEvolution: "Hoe de muziek evolueerde door de jaren heen in deze collectie",
      legendaryFigures: "Verhalen over de meest invloedrijke artiesten in de collectie",
      hiddenConnections: "Fascinerende verbanden tussen artiesten",
      collaborationTales: "Verhalen over samenwerkingen en wederzijdse invloeden",
      artisticJourneys: "Evolutie van belangrijke artiesten door hun carrières",
      crossGenreInfluences: "Hoe artiesten genres hebben overstegen en beïnvloed",
      legendaryStudios: "Verhalen over beroemde studio's waar albums zijn opgenomen",
      iconicProducers: "Verhalen over producers en hun unieke sound",
      recordingInnovations: "Technische doorbraken in de opnametechniek",
      labelHistories: "Geschiedenis en betekenis van belangrijke platenlabels",
      soundEngineering: "Bijzondere aspecten van geluidstechniek en productie",
      societalInfluence: "Hoe deze albums de maatschappij hebben beïnvloed",
      generationalMovements: "Muzikale bewegingen die generaties hebben gedefinieerd",
      politicalMessages: "Politieke en sociale boodschappen in de muziek",
      fashionAndStyle: "Invloed op mode, lifestyle en cultuur",
      globalReach: "Internationale impact en cultuuruitwisseling",
      technicalBreakthroughs: "Technische vernieuwingen in instrumentatie en opname",
      genreCreation: "Nieuwe genres die ontstonden uit deze bewegingen",
      instrumentalPioneering: "Innovatief gebruik van instrumenten",
      vocalTechniques: "Bijzondere zangtechnieken en stijlen",
      productionMethods: "Baanbrekende productiemethoden",
      underratedMasterpieces: "Ondergewaardeerde pareltjes in de collectie",
      rareFfinds: "Zeldzame vondsten en speciale uitgaven",
      collectorSecrets: "Insider tips voor verzamelaars",
      sleepersHits: "Albums die later erkend werden als classics",
      deepCuts: "Verborgen tracks en B-sides die de moeite waard zijn",
      genreEvolution: "Hoe genres evolueerden en elkaar beïnvloedden",
      artistInfluences: "Wederzijdse beïnvloeding tussen artiesten",
      labelConnections: "Verbanden tussen platenlabels en hun sound",
      sceneConnections: "Lokale scenes en hun internationale impact",
      crossPollination: "Cultuuruitwisseling en genre-vermenging",
      soundQuality: "Analyse van geluidskwaliteit en opnametechnieken",
      formatSignificance: "Betekenis van verschillende formats (vinyl vs CD)",
      pressingQuality: "Kwaliteit van verschillende persingen en uitgaven",
      artwork: "Iconische album hoezen en visuele aspecten",
      packaging: "Bijzondere verpakkingen en limited editions",
      nextExplorations: "Suggesties voor verdere verkenning",
      relatedArtists: "Gerelateerde artiesten om te ontdekken",
      genreExpansions: "Genres om verder te verdiepen",
      eraExplorations: "Tijdperken om meer van te leren",
      labelDiveDeeps: "Labels waarvan de catalogus interessant is"
    };
    const d = jsonDescriptions;

    prompt += `

{
  "musicHistoryTimeline": {
    "overview": "${d.overview}",
    "keyPeriods": ["${d.keyPeriods}"],
    "culturalMovements": ["${d.culturalMovements}"],
    "musicalEvolution": "${d.musicalEvolution}"
  },
  "artistStories": {
    "legendaryFigures": ["${d.legendaryFigures}"],
    "hiddenConnections": ["${d.hiddenConnections}"],
    "collaborationTales": ["${d.collaborationTales}"],
    "artisticJourneys": ["${d.artisticJourneys}"],
    "crossGenreInfluences": ["${d.crossGenreInfluences}"]
  },
  "studioLegends": {
    "legendaryStudios": ["${d.legendaryStudios}"],
    "iconicProducers": ["${d.iconicProducers}"],
    "recordingInnovations": ["${d.recordingInnovations}"],
    "labelHistories": ["${d.labelHistories}"],
    "soundEngineering": ["${d.soundEngineering}"]
  },
  "culturalImpact": {
    "societalInfluence": ["${d.societalInfluence}"],
    "generationalMovements": ["${d.generationalMovements}"],
    "politicalMessages": ["${d.politicalMessages}"],
    "fashionAndStyle": ["${d.fashionAndStyle}"],
    "globalReach": ["${d.globalReach}"]
  },
  "musicalInnovations": {
    "technicalBreakthroughs": ["${d.technicalBreakthroughs}"],
    "genreCreation": ["${d.genreCreation}"],
    "instrumentalPioneering": ["${d.instrumentalPioneering}"],
    "vocalTechniques": ["${d.vocalTechniques}"],
    "productionMethods": ["${d.productionMethods}"]
  },
  "hiddenGems": {
    "underratedMasterpieces": ["${d.underratedMasterpieces}"],
    "rareFfinds": ["${d.rareFfinds}"],
    "collectorSecrets": ["${d.collectorSecrets}"],
    "sleepersHits": ["${d.sleepersHits}"],
    "deepCuts": ["${d.deepCuts}"]
  },
  "musicalConnections": {
    "genreEvolution": ["${d.genreEvolution}"],
    "artistInfluences": ["${d.artistInfluences}"],
    "labelConnections": ["${d.labelConnections}"],
    "sceneConnections": ["${d.sceneConnections}"],
    "crossPollination": ["${d.crossPollination}"]
  },
  "technicalMastery": {
    "soundQuality": "${d.soundQuality}",
    "formatSignificance": "${d.formatSignificance}",
    "pressingQuality": "${d.pressingQuality}",
    "artwork": "${d.artwork}",
    "packaging": "${d.packaging}"
  },
  "discoveryPaths": {
    "nextExplorations": ["${d.nextExplorations}"],
    "relatedArtists": ["${d.relatedArtists}"],
    "genreExpansions": ["${d.genreExpansions}"],
    "eraExplorations": ["${d.eraExplorations}"],
    "labelDiveDeeps": ["${d.labelDiveDeeps}"]
  }
}

${isEnglish ? 'IMPORTANT: Return ONLY valid JSON without markdown backticks or other formatting!' : 'BELANGRIJK: Return ALLEEN valid JSON zonder markdown backticks of andere formatting!'}`;

    console.log('🤖 Calling Lovable AI with music historian prompt...');
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable AI key not found');
    }

    // Retry logic with exponential backoff for rate limits
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 2000; // 2 seconds
    
    let openAIResponse;
    let lastError;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        openAIResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: langInstruction + ' You specialize in music collections and listening patterns. You provide deep, fascinating insights about music history, cultural context, and artistic connections. Return only valid JSON without any markdown formatting.'
              },
              {
                role: 'user', 
                content: prompt
              }
            ],
          }),
        });

        if (openAIResponse.ok) {
          console.log('✅ Lovable AI call successful');
          break; // Success, exit retry loop
        }

        // Handle different error types
        const errorText = await openAIResponse.text();
        console.error(`Lovable AI error (attempt ${attempt + 1}):`, openAIResponse.status, errorText);
        
        if (openAIResponse.status === 429) {
          // Rate limit - retry
          lastError = new Error('Te veel verzoeken naar de AI. Even geduld en probeer het over 30 seconden opnieuw.');
          if (attempt === MAX_RETRIES - 1) {
            throw lastError;
          }
          continue; // Retry
        } else if (openAIResponse.status === 402) {
          // Payment required
          throw new Error('AI credits zijn op. Voeg credits toe in Settings → Workspace → Usage.');
        } else if (openAIResponse.status >= 500) {
          // Server error - retry
          lastError = new Error('AI service tijdelijk niet beschikbaar. Probeer het later opnieuw.');
          if (attempt === MAX_RETRIES - 1) {
            throw lastError;
          }
          continue; // Retry
        } else {
          // Client error (4xx except 429) - don't retry
          throw new Error(`AI analyse fout: ${openAIResponse.status} - ${errorText.substring(0, 200)}`);
        }
      } catch (error) {
        if (error.message.includes('AI analyse') || error.message.includes('overbelast')) {
          throw error; // Re-throw our custom errors
        }
        lastError = error;
        if (attempt === MAX_RETRIES - 1) {
          throw new Error('Kon geen verbinding maken met AI service. Check je internetverbinding.');
        }
      }
    }

    const openAIData = await openAIResponse.json();
    const rawContent = openAIData.choices[0]?.message?.content;
    
    console.log('🤖 Raw Lovable AI response received, length:', rawContent?.length || 0);
    
    if (!rawContent) {
      throw new Error('No content received from AI');
    }

    // Parse the AI analysis with intelligent fallback
    const collectionData = {
      uniqueArtists,
      uniqueGenres, 
      totalItems: allItems.length + spotifyTracks.length,
      topArtists: artistInfo.slice(0, 10),
      topGenres: Array.from(allGenresSet).slice(0, 10)
    };
    
    const aiAnalysis = safeJsonParse(rawContent, collectionData);

    // Prepare enhanced chart data combining physical and Spotify data
    const combinedGenres = {};
    
    // Add physical collection genres
    allItems.forEach(item => {
      if (item.genre) {
        if (!combinedGenres[item.genre]) combinedGenres[item.genre] = { physical: 0, spotify: 0 };
        combinedGenres[item.genre].physical++;
      }
    });
    
    // Add Spotify genres
    spotifyTracks.forEach(track => {
      if (track.genre) {
        if (!combinedGenres[track.genre]) combinedGenres[track.genre] = { physical: 0, spotify: 0 };
        combinedGenres[track.genre].spotify++;
      }
    });

    const genreDistribution = Object.entries(combinedGenres)
      .map(([name, counts]) => {
        const total = counts.physical + counts.spotify;
        return {
          name,
          value: total,
          physical: counts.physical,
          spotify: counts.spotify,
          percentage: Math.round((total / (allItems.length + spotifyTracks.length)) * 100)
        };
      })
      .sort((a, b) => b.value - a.value);

    const formatDistribution = [
      { name: "CD", value: cdItems?.length || 0, fill: "#8B5CF6" },
      { name: "Vinyl", value: vinylItems?.length || 0, fill: "#A78BFA" },
      { name: "Spotify", value: spotifyTracks.length || 0, fill: "#1DB954" }
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
        spotifyTracks: spotifyTracks.length,
        spotifyPlaylists: spotifyPlaylists.length,
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
        vinylCount: vinylItems?.length || 0,
        aiScanCount: completedAiItems.length,
        hasPhysicalCollection,
        hasSpotifyData,
        physicalArtistsCount: physicalArtistSet.size,
        spotifyArtistsCount: spotifyArtistSet.size
      },
      chartData: {
        genreDistribution,
        formatDistribution,
        topArtists,
        decadeDistribution,
        labelAnalysis,
        artistConnections: topArtists
      },
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Music history analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Analysis failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});