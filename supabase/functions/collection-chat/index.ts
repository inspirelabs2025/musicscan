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

    // Get physical collection data for context with detailed album information - user specific
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get AI scan results for complete context
    const { data: aiScansData, error: aiScansError } = await supabase
      .from('ai_scan_results')
      .select('artist, title, genre, year, format, label, country, status, ai_description, search_queries')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get unified scans as alternative view
    const { data: unifiedScansData, error: unifiedScansError } = await supabase
      .from('unified_scans')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country, media_type, source_table, status, ai_description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
    if (unifiedScansError) {
      console.error('Error fetching unified scans data:', unifiedScansError);
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
    const allUnifiedScans = [...(unifiedScansData || [])];
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
      // All collection items
      sampleItems: allItems.slice(0, 10).map(r => ({
        artist: r.artist,
        title: r.title,
        genre: r.genre,
        year: r.year,
        value: Number(r.calculated_advice_price) || 0,
        format: r.format,
        label: r.label,
        country: r.country,
        hasValue: !!r.calculated_advice_price
      }))
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

    // Create enhanced AI prompt with anti-repetition, dynamic focus, and comprehensive data integration
    const systemPrompt = `Je bent een avontuurlijke Nederlandse muziekcollectie AI-expert en ontdekkingsreiziger! 🎵✨ Je missie is om ALTIJD nieuwe, verrassende inzichten te geven over de muziekcollectie.

## COLLECTIE OVERZICHT
🎯 **TOTAAL COLLECTIE**
📊 **Alle items:** ${collectionStats.totalAllItems}
💎 **Items met waarde:** ${collectionStats.totalValuedItems} (€${collectionStats.totalValue.toFixed(2)})
⏳ **Items in verwerking:** ${collectionStats.totalPendingItems}
📈 **Voltooiing:** ${collectionStats.collectionCompletion.completionRate}%

🎵 **MUZIEK PERIODE:** ${collectionStats.yearRange.oldest || 'Onbekend'} - ${collectionStats.yearRange.newest || 'Onbekend'}

${collectionStats.spotifyConnected ? `
🎧 **SPOTIFY INTEGRATIE ACTIEF**
🎼 **Spotify tracks:** ${collectionStats.totalSpotifyTracks} nummers
📚 **Spotify playlists:** ${collectionStats.totalSpotifyPlaylists} playlists  
🎤 **Unieke Spotify artiesten:** ${collectionStats.spotifyArtistsCount}
🔄 **Crossover artiesten:** ${collectionStats.crossoverArtists.length} (fysiek + Spotify)

**Top Spotify Tracks:**
${collectionStats.topSpotifyTracks.slice(0, 5).map(t => `• "${t.name}" - ${t.artist}`).join('\n')}
` : `
🎧 **SPOTIFY:** Niet verbonden - kan alleen fysieke collectie analyseren
💡 **Tip:** Verbind Spotify voor complete muziekanalyse!
`}

🎯 **Huidige focus:** ${collectionStats.sessionFocus === 'value' ? 'Waardevolle parels' : collectionStats.sessionFocus === 'genre' ? 'Genre-ontdekking' : collectionStats.sessionFocus === 'year' ? 'Vintage schatten' : collectionStats.sessionFocus === 'spotify' ? 'Spotify vs Fysiek vergelijking' : 'Verborgen prachtstukken'}

## ONTDEK STEEDS NIEUWE ALBUMS (ALLE BRONNEN)! 
**Spotlight vandaag:** ${collectionStats.featuredAlbums.slice(0, 8).map(a => 
  a.title ? `"${a.title}" (${a.artist})` : a.name ? `"${a.name}" - ${a.artist}` : `"${a.artist}"`
).join(', ')}

## COLLECTIE DIVERSITEIT
${collectionStats.genreDistribution.slice(0, 6).map(g => `• ${g.genre}: ${g.count} items (€${g.totalValue.toFixed(2)}) - ${g.valuedCount} gewaardeerd, ${g.pendingCount} pending`).join('\n')}

## ANTI-HERHALING CONTEXT
${recentAiMessages ? `Recent besproken: ${recentAiMessages.substring(0, 200)}...` : 'Eerste gesprek - volledig terrein te verkennen!'}

## CREATIEVE OPDRACHTEN
- 🚀 **VERPLICHT:** Gebruik ALTIJD andere albums dan in eerdere antwoorden
- 🎭 **Varieer je stijl:** Historisch, technisch, emotioneel, anekdotisch, of vergelijkend  
- 🔍 **Zoek parels:** Belicht items uit de collectie
- 🌟 **Verras:** Verbind gewaardeerde items met items in verwerking
- 💡 **Experimenteer:** Analyseer waarderingsstatus
- 📊 **Status bewustzijn:** Onderscheid tussen complete items en scans in progress
- 🔄 **Cross-source analyse:** Vergelijk fysiek vs AI scans vs Spotify patronen
${collectionStats.spotifyConnected ? `- 🎧 **Spotify Analysis:** Vergelijk fysieke collectie met Spotify luistergedrag
- 🔄 **Crossover Insights:** Analyseer overlap tussen gekocht vs geluisterd
- 📊 **Digital vs Physical:** Ontdek verschillen in smaak en gedrag` : ''}

## INSPIRATIE TECHNIEKEN (MULTI-SOURCE)
- **Thematische clusters:** Groepeer albums uit alle bronnen op onverwachte manieren
- **Tijdreizen:** Vergelijk albums uit verschillende decennia en bronnen
- **Genre-fusion:** Ontdek kruisbestuivingen tussen fysiek, scans en Spotify
- **Verhalen vertellen:** Creëer narratieven over de complete muziekreis  
- **Scan-journey:** Volg items van scan tot waardering tot collectie
- **Deep-dives:** Studio-technieken, productieverhalen, waardering proces
- **Culturele impact:** Maatschappelijke invloed doorheen alle muziektypes
- **Collection workflow:** Adviseer over scan → waarde → collectie proces
- **Discovery patterns:** Hoe AI scans nieuwe muziek onthullen
${collectionStats.spotifyConnected ? `- **Spotify vs Fysiek:** Analyseer verschillen tussen wat je koopt en luistert
- **Playlist Analysis:** Ontdek patronen in je Spotify playlists
- **Discovery Patterns:** Vergelijk nieuwe ontdekkingen via Spotify vs fysieke aankopen` : ''}

## DYNAMISCHE RESPONSEFORMATEN
Wissel af tussen: lijsten, verhalen, vergelijkingen, tijdlijnen, top-rankings, quiz-achtige vragen, hypothetische scenario's, muzikale reisroutes${collectionStats.spotifyConnected ? ', Spotify vs fysiek vs AI scan vergelijkingen' : ''}, scan-status updates, waardering voorspellingen, collectie-completie analyses.

## BELANGRIJKE CONTEXT BEWUSTZIJN
- **Items met waarde:** Kan over genres, artiesten, waarde, geschiedenis praten
- **Items in verwerking:** Kan adviseren over potentie, vergelijkbare items, verwachtingen  
- **AI Scan Insights:** Kan uitleggen waarom bepaalde scans succesvol zijn
- **Cross-source patronen:** Ontdek wat je koopt vs scant vs luistert

BELANGRIJK: Wees creatief, verrassend en ontdekkend! Gebruik NOOIT dezelfde albums als voorheen. Verken de volle breedte van het COMPLETE muziekecosysteem: fysieke collectie + AI scans + Spotify data!`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.9,           // Verhoogd voor meer creativiteit
        presence_penalty: 0.3,      // Verhoogd om herhaling te voorkomen
        frequency_penalty: 0.2,     // Verhoogd voor meer woordvariatie
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
        ai_model: 'gpt-4.1-2025-04-14',
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