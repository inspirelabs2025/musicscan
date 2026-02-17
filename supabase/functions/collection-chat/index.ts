import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  message: string;
  sender_type: 'user' | 'ai';
  session_id?: string;
}

// Search function to find specific items in collection
async function searchCollection(supabase: any, userId: string, searchTerm: string) {
  console.log(`🔍 Searching collection for: "${searchTerm}"`);
  
  const searchPattern = `%${searchTerm.toLowerCase()}%`;
  
  // Search across all collection tables
  const [cdResults, vinylResults, aiResults] = await Promise.all([
    supabase
      .from('cd_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country, catalog_number, discogs_url')
      .eq('user_id', userId)
      .or(`artist.ilike.${searchPattern},title.ilike.${searchPattern},label.ilike.${searchPattern},catalog_number.ilike.${searchPattern}`)
      .order('calculated_advice_price', { ascending: false, nullsLast: true })
      .limit(20),
    
    supabase
      .from('vinyl2_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country, catalog_number, discogs_url')
      .eq('user_id', userId)
      .or(`artist.ilike.${searchPattern},title.ilike.${searchPattern},label.ilike.${searchPattern},catalog_number.ilike.${searchPattern}`)
      .order('calculated_advice_price', { ascending: false, nullsLast: true })
      .limit(20),
    
    supabase
      .from('ai_scan_results')
      .select('artist, title, genre, year, format, label, country, catalog_number, discogs_url, status, ai_description')
      .eq('user_id', userId)
      .or(`artist.ilike.${searchPattern},title.ilike.${searchPattern},label.ilike.${searchPattern},catalog_number.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const allResults = [
    ...(cdResults.data || []).map(item => ({ ...item, source: 'cd_scan' })),
    ...(vinylResults.data || []).map(item => ({ ...item, source: 'vinyl2_scan' })),
    ...(aiResults.data || []).map(item => ({ ...item, source: 'ai_scan_results' }))
  ];

  console.log(`✅ Found ${allResults.length} search results`);
  return allResults;
}

// Detect if user input contains search intent
function detectSearchIntent(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // Skip if message is too long (likely a general question, not a search)
  if (lowerMessage.length > 80) return null;
  
  // Skip general/conversational messages
  const skipPatterns = [
    /^(hoi|hey|hallo|hi|dag|goedemorgen|goedemiddag|goedenavond)/,
    /\b(advies|tips?|suggesties?|aanbeveling|help|uitleg|vertel|wat is|wat zijn|hoe |waarom|kun je|geef me|give me|tell me|how |what |why |can you)\b/,
    /\b(trends?|analyse|statistiek|waarde van mijn|investment|invest|recommend)\b/,
    /\b(beste|slechtste|duurste|goedkoopste|oudste|nieuwste|populairste|zeldzaamste)\b/,
    /\?$/  // Questions are usually not search queries
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(lowerMessage)) return null;
  }
  
  // Only match explicit search patterns
  const searchPatterns = [
    /zoek(?:\s+naar)?\s+(.+)/,
    /vind\s+(.+)/,
    /heb ik\s+(.+)/,
    /waar is\s+(.+)/,
    /toon(?:\s+me)?\s+(.+)/,
    /laat(?:\s+me)?\s+(.+)\s+zien/,
    /search(?:\s+for)?\s+(.+)/,
    /find\s+(.+)/
  ];
  
  for (const pattern of searchPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      const searchTerm = match[1].trim();
      if (searchTerm.length > 2 && searchTerm.length < 60) {
        return searchTerm;
      }
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, session_id } = await req.json() as ChatMessage & { session_id: string };
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Processing chat message:', message, 'for user:', userId, 'session:', session_id);
    const startTime = Date.now();

    // Fetch chat history for session context to avoid repetition
    const { data: sessionMessages } = await supabase
      .from('chat_messages')
      .select('message, sender_type, created_at')
      .eq('user_id', userId)
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentAiMessages = (sessionMessages || [])
      .filter(m => m.sender_type === 'ai')
      .slice(0, 3)
      .map(m => m.message)
      .join(' ');

    // 🎯 SMART SEARCH DETECTION
    const searchTerm = detectSearchIntent(message);
    let searchResults: any[] = [];
    let isSearchQuery = false;
    
    if (searchTerm) {
      console.log(`🎯 Detected search query for: "${searchTerm}"`);
      isSearchQuery = true;
      searchResults = await searchCollection(supabase, userId, searchTerm);
    }

    // Get enhanced collection data with increased limits for better coverage
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country, catalog_number, discogs_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Increased from default

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country, catalog_number, discogs_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Increased from default

    // Get AI scan results for complete context
    const { data: aiScansData, error: aiScansError } = await supabase
      .from('ai_scan_results')
      .select('artist, title, genre, year, format, label, country, status, ai_description, search_queries, catalog_number, discogs_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Increased from default

    // Skip unified_scans (view does not exist)

    // Get Spotify data for enhanced context
    const { data: spotifyTracks, error: spotifyTracksError } = await supabase
      .from('spotify_tracks')
      .select('title, artist, album, duration_ms, explicit, popularity, preview_url, spotify_track_id')
      .eq('user_id', userId)
      .order('popularity', { ascending: false })
      .limit(500);

    const { data: spotifyPlaylists, error: spotifyPlaylistsError } = await supabase
      .from('spotify_playlists')
      .select('name, description, track_count, is_public, spotify_playlist_id')
      .eq('user_id', userId)
      .order('track_count', { ascending: false });

    const { data: spotifyStats, error: spotifyStatsError } = await supabase
      .from('spotify_user_stats')
      .select('name, stat_type, time_range, rank_position, data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Check if user has Spotify connection
    const { data: profileData } = await supabase
      .from('profiles')
      .select('spotify_connected, spotify_display_name')
      .eq('user_id', userId)
      .single();

    if (cdError) {
      console.error('Error fetching CD data:', cdError);
    }
    if (vinylError) {
      console.error('Error fetching vinyl data:', vinylError);
    }
    if (aiScansError) {
      console.error('Error fetching AI scans data:', aiScansError);
    }
    if (spotifyTracksError) {
      console.error('Error fetching Spotify tracks:', spotifyTracksError);
    }
    if (spotifyPlaylistsError) {
      console.error('Error fetching Spotify playlists:', spotifyPlaylistsError);
    }
    if (spotifyStatsError) {
      console.error('Error fetching Spotify stats:', spotifyStatsError);
    }

    // Combine and analyze all music data (physical + AI scans + Spotify)
    const allPhysicalRecords = [...(cdData || []), ...(vinylData || [])];
    const allAiScans = [...(aiScansData || [])];
    const allUnifiedScans: any[] = [];
    const hasSpotifyData = !!(spotifyTracks && spotifyTracks.length > 0);
    const spotifyConnected = profileData?.spotify_connected || false;
    
    // Combine all items into one unified collection
    const allItems = [...allPhysicalRecords, ...allAiScans];
    const itemsWithValues = allItems.filter(item => item.calculated_advice_price);
    const itemsWithoutValues = allItems.filter(item => !item.calculated_advice_price);
    
    // Total unified collection
    const totalAllItems = allItems.length;
    
    // Smart album selection based on conversation context
    const getRandomAlbumSet = (records: any[], count: number) => {
      const shuffled = [...records].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    // Rotate focus based on session ID to ensure variety
    const sessionHash = session_id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const focusIndex = Math.abs(sessionHash) % 5;
    const focusTypes = ['value', 'genre', 'year', 'spotify', 'random'];
    const currentFocus = focusTypes[focusIndex];

    // Process Spotify data for insights
    const spotifyArtists = new Set(spotifyTracks?.map(t => t.artist) || []);
    const spotifyAlbums = new Set(spotifyTracks?.map(t => t.album) || []);
    const topSpotifyTracks = spotifyTracks?.slice(0, 20) || [];
    const topSpotifyArtists = spotifyStats?.filter(s => s.stat_type === 'artist' && s.time_range === 'medium_term')?.slice(0, 10) || [];
    
    // Create comprehensive collection context (Physical + AI Scans + Spotify)
    const collectionStats = {
      // Complete Collection Overview
      totalAllItems,
      totalPhysicalItems: allPhysicalRecords.length,
      totalAiScans: allAiScans.length,
      totalUnifiedScans: allUnifiedScans.length,
      
      // Items with calculated values (valued collection)
      totalValuedItems: itemsWithValues.length,
      totalValue: itemsWithValues.reduce((sum, record) => sum + (Number(record.calculated_advice_price) || 0), 0),
      
      // Items without values (scanned but not priced)
      totalPendingItems: itemsWithoutValues.length,
      
      // All items analysis (valued + pending)
      allItemsGenres: [...new Set([...allPhysicalRecords, ...allAiScans].map(r => r.genre).filter(Boolean))],
      allItemsArtists: Object.entries(
        [...allPhysicalRecords, ...allAiScans].reduce((acc: any, r) => {
          if (r.artist) acc[r.artist] = (acc[r.artist] || 0) + 1;
          return acc;
        }, {})
      ).slice(0, 20),
      formats: [...allPhysicalRecords, ...allAiScans].reduce((acc: any, r) => {
        const format = r.format || 'Unknown';
        acc[format] = (acc[format] || 0) + 1;
        return acc;
      }, {}),
      // Top valued items
      topValueAlbums: itemsWithValues
        .sort((a, b) => (Number(b.calculated_advice_price) || 0) - (Number(a.calculated_advice_price) || 0))
        .slice(0, 15)
        .map(r => ({
          artist: r.artist,
          title: r.title,
          value: Number(r.calculated_advice_price) || 0,
          format: r.format,
          year: r.year
        })),
      
      // Genre distribution across all items
      genreDistribution: [...new Set([...allPhysicalRecords, ...allAiScans].map(r => r.genre).filter(Boolean))]
        .map(genre => ({
          genre,
          count: [...allPhysicalRecords, ...allAiScans].filter(r => r.genre === genre).length,
          totalValue: [...allPhysicalRecords, ...allAiScans].filter(r => r.genre === genre)
            .reduce((sum, r) => sum + (Number(r.calculated_advice_price) || 0), 0),
          valuedCount: itemsWithValues.filter(r => r.genre === genre).length,
          pendingCount: itemsWithoutValues.filter(r => r.genre === genre).length
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10),
        
      yearRange: {
        oldest: Math.min(...[...allPhysicalRecords, ...allAiScans].map(r => r.year).filter(Boolean)),
        newest: Math.max(...[...allPhysicalRecords, ...allAiScans].map(r => r.year).filter(Boolean))
      },
      
      
      // Spotify Integration
      spotifyConnected,
      hasSpotifyData,
      totalSpotifyTracks: spotifyTracks?.length || 0,
      totalSpotifyPlaylists: spotifyPlaylists?.length || 0,
      spotifyArtistsCount: spotifyArtists.size,
      spotifyAlbumsCount: spotifyAlbums.size,
      topSpotifyTracks: topSpotifyTracks.map(t => ({
        name: t.title,
        artist: t.artist,
        album: t.album,
        popularity: t.popularity
      })),
      topSpotifyArtists: topSpotifyArtists.map(a => ({
        name: a.name,
        data: a.data
      })),
      spotifyPlaylists: spotifyPlaylists?.slice(0, 10).map(p => ({
        name: p.name,
        trackCount: p.track_count,
        public: p.is_public
      })) || [],
      
      // Cross-analysis (Physical + AI Scans + Spotify)
      crossoverArtists: hasSpotifyData ? 
        [...new Set([...allPhysicalRecords, ...allAiScans].map(r => r.artist).filter(Boolean))]
          .filter(artist => spotifyArtists.has(artist))
          .slice(0, 15) : [],
          
      // Collection completion insights
      collectionCompletion: {
        totalItems: totalAllItems,
        completedItems: itemsWithValues.length,
        pendingItems: itemsWithoutValues.length,
        completionRate: totalAllItems > 0 ? ((itemsWithValues.length / totalAllItems) * 100).toFixed(1) : 0
      },
      
      // Dynamic album sampling based on current focus
      featuredAlbums: currentFocus === 'value' 
        ? itemsWithValues.sort((a, b) => (Number(b.calculated_advice_price) || 0) - (Number(a.calculated_advice_price) || 0)).slice(0, 15)
        : currentFocus === 'genre'
        ? getRandomAlbumSet(allItems.filter(r => r.genre), 15)
        : currentFocus === 'year'
        ? getRandomAlbumSet(allItems.filter(r => r.year && r.year < 1990), 15)
        : currentFocus === 'spotify' && hasSpotifyData
        ? topSpotifyTracks.slice(0, 15)
        : getRandomAlbumSet(allItems, 15),
        
      sessionFocus: currentFocus,
      // Enhanced collection sampling - much larger sample size
      sampleItems: allItems.slice(0, 100).map(r => ({
        artist: r.artist,
        title: r.title,
        genre: r.genre,
        year: r.year,
        value: Number(r.calculated_advice_price) || 0,
        format: r.format,
        label: r.label,
        country: r.country,
        hasValue: !!r.calculated_advice_price,
        catalog_number: r.catalog_number,
        discogs_url: r.discogs_url
      })),
      
      // 🔍 SEARCH RESULTS (if search was performed)
      searchResults: isSearchQuery ? {
        searchTerm,
        results: searchResults.slice(0, 20).map(r => ({
          artist: r.artist,
          title: r.title,
          genre: r.genre,
          year: r.year,
          value: Number(r.calculated_advice_price) || 0,
          format: r.format,
          label: r.label,
          country: r.country,
          source: r.source,
          catalog_number: r.catalog_number,
          discogs_url: r.discogs_url,
          hasValue: !!r.calculated_advice_price
        })),
        found: searchResults.length,
        query: message
      } : null
    };

    // Store user message
    await supabase
      .from('chat_messages')
      .insert({
        message,
        sender_type: 'user',
        session_id,
        user_id: userId,
        collection_context: collectionStats
      });

    // ⚡ OPTIMIZED AI PROMPT - Focused on Search Results when applicable
    const systemPrompt = collectionStats.searchResults ? 
      `🔍 **SEARCH RESULTATEN GEVONDEN!**
Je bent een Nederlandse muziekcollectie AI-expert die EXACT de gevraagde informatie kan vinden!

## 🎯 ZOEKOPDRACHT: "${collectionStats.searchResults.searchTerm}"
**Gevonden:** ${collectionStats.searchResults.found} items in collectie

${collectionStats.searchResults.results.length > 0 ? `
**GEVONDEN ALBUMS:**
${collectionStats.searchResults.results.map(r => 
  `• **"${r.title}"** door ${r.artist} ${r.value > 0 ? `(€${r.value})` : '(in verwerking)'} [${r.format || r.source}]`
).join('\n')}
` : '❌ Geen exacte matches gevonden voor deze zoekopdracht.'}

## 📊 COLLECTIE CONTEXT
- **Totaal:** ${collectionStats.totalAllItems} items (€${collectionStats.totalValue.toFixed(2)})
- **Voltooiing:** ${collectionStats.collectionCompletion.completionRate}%
${collectionStats.spotifyConnected ? `- **Spotify:** ${collectionStats.totalSpotifyTracks} tracks verbonden` : ''}

## 🎵 OPDRACHT
1. **FOCUS OP GEVONDEN ITEMS:** Geef detailed info over elk gevonden album
2. **VERTEL VERHALEN:** Geschiedenis, bijzonderheden, waardering, rariteit
3. **GEEF CONTEXT:** Hoe passen ze in de collectie? Wat maakt ze speciaal?
4. **SUGGESTIES:** Gerelateerde albums om te zoeken of aan te schaffen
5. **WAARDE INZICHT:** Marktwaarde, trends, investment potentieel

BELANGRIJK: Geef CONCRETE, SPECIFIEKE informatie over de gevonden albums!` 
      :
      `🎵 **COLLECTIE AI EXPERT** - Ontdek & Analyseer je Muziek!

## 📊 COLLECTIE OVERZICHT  
- **Totaal:** ${collectionStats.totalAllItems} items (€${collectionStats.totalValue.toFixed(2)})
- **Met waarde:** ${collectionStats.totalValuedItems} • **In verwerking:** ${collectionStats.totalPendingItems}
- **Voltooiing:** ${collectionStats.collectionCompletion.completionRate}%
${collectionStats.spotifyConnected ? `- **Spotify:** ${collectionStats.totalSpotifyTracks} tracks • ${collectionStats.crossoverArtists.length} crossover artiesten` : ''}

## 🎯 TOP ITEMS VANDAAG
${collectionStats.featuredAlbums.slice(0, 5).map(a => 
  a.title ? `• "${a.title}" - ${a.artist}` : a.name ? `• "${a.name}" - ${a.artist}` : `• ${a.artist}`
).join('\n')}

## 🎭 EXPERTISE GEBIEDEN
- **Waarde Analyse:** Markttrends, investment tips, rariteit
- **Genre Ontdekking:** Verborgen parels, nieuwe stijlen  
- **Historische Context:** Verhalen achter albums, cultuur impact
- **Collectie Optimalisatie:** Aankoopadvies, gaps identificeren
${collectionStats.spotifyConnected ? '- **Digital vs Fysiek:** Luistergewoonten vs verzamelgedrag' : ''}

## 🚀 ANTI-HERHALING
${recentAiMessages ? `Recente topics: ${recentAiMessages.substring(0, 150)}...` : 'Verse start - alle terrein open!'}

**OPDRACHT:** Wees verrassend, specifiek en ontdekkend! Gebruik verschillende albums dan eerder besproken.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const openaiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${message}${collectionStats.searchResults ? `

🔍 SEARCH RESULTS:
${JSON.stringify(collectionStats.searchResults, null, 2)}` : `

📊 COLLECTIE SAMPLE DATA:
${JSON.stringify(collectionStats.sampleItems.slice(0, 20), null, 1)}`}`
          }
        ],
        max_tokens: 2000
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiMessage = openaiData.choices[0]?.message?.content || 'Sorry, ik kon geen antwoord genereren.';
    const tokensUsed = openaiData.usage?.total_tokens || 0;
    const responseTime = Date.now() - startTime;

    // Store AI message
    await supabase
      .from('chat_messages')
      .insert({
        message: aiMessage,
        sender_type: 'ai',
        session_id,
        user_id: userId,
        ai_model: 'google/gemini-2.5-flash',
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        format_type: 'markdown',
        collection_context: collectionStats
      });

    console.log('Chat response generated successfully');

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        collection_stats: collectionStats
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing chat:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});