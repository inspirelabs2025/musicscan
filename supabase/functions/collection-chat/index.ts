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

    // Get collection data for context with detailed album information - user specific
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .not('calculated_advice_price', 'is', null)
      .order('calculated_advice_price', { ascending: false });

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .not('calculated_advice_price', 'is', null)
      .order('calculated_advice_price', { ascending: false });

    if (cdError) {
      console.error('Error fetching CD data:', cdError);
    }
    if (vinylError) {
      console.error('Error fetching vinyl data:', vinylError);
    }

    // Combine and analyze collection
    const allRecords = [...(cdData || []), ...(vinylData || [])];
    
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
    
    const focusIndex = Math.abs(sessionHash) % 4;
    const focusTypes = ['value', 'genre', 'year', 'random'];
    const currentFocus = focusTypes[focusIndex];
    
    // Create detailed collection context with dynamic sampling
    const collectionStats = {
      totalItems: allRecords.length,
      totalValue: allRecords.reduce((sum, record) => sum + (Number(record.calculated_advice_price) || 0), 0),
      genres: [...new Set(allRecords.map(r => r.genre).filter(Boolean))],
      topArtists: Object.entries(
        allRecords.reduce((acc: any, r) => {
          if (r.artist) acc[r.artist] = (acc[r.artist] || 0) + 1;
          return acc;
        }, {})
      ).slice(0, 15),
      formats: allRecords.reduce((acc: any, r) => {
        const format = r.format || 'Unknown';
        acc[format] = (acc[format] || 0) + 1;
        return acc;
      }, {}),
      topValueAlbums: allRecords
        .sort((a, b) => (Number(b.calculated_advice_price) || 0) - (Number(a.calculated_advice_price) || 0))
        .slice(0, 10)
        .map(r => ({
          artist: r.artist,
          title: r.title,
          value: Number(r.calculated_advice_price) || 0,
          format: r.format,
          year: r.year
        })),
      genreDistribution: [...new Set(allRecords.map(r => r.genre).filter(Boolean))]
        .map(genre => ({
          genre,
          count: allRecords.filter(r => r.genre === genre).length,
          totalValue: allRecords.filter(r => r.genre === genre)
            .reduce((sum, r) => sum + (Number(r.calculated_advice_price) || 0), 0)
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 8),
      yearRange: {
        oldest: Math.min(...allRecords.map(r => r.year).filter(Boolean)),
        newest: Math.max(...allRecords.map(r => r.year).filter(Boolean))
      },
      // Dynamic album sampling based on current focus
      featuredAlbums: currentFocus === 'value' 
        ? allRecords.sort((a, b) => (Number(b.calculated_advice_price) || 0) - (Number(a.calculated_advice_price) || 0)).slice(0, 15)
        : currentFocus === 'genre'
        ? getRandomAlbumSet(allRecords.filter(r => r.genre), 15)
        : currentFocus === 'year'
        ? getRandomAlbumSet(allRecords.filter(r => r.year && r.year < 1990), 15)
        : getRandomAlbumSet(allRecords, 15),
      sessionFocus: currentFocus,
      albums: allRecords.map(r => ({
        artist: r.artist,
        title: r.title,
        genre: r.genre,
        year: r.year,
        value: Number(r.calculated_advice_price) || 0,
        format: r.format,
        label: r.label,
        country: r.country
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

    // Create enhanced AI prompt with anti-repetition and dynamic focus
    const systemPrompt = `Je bent een avontuurlijke Nederlandse muziekcollectie AI-expert en ontdekkingsreiziger! 🎵✨ Je missie is om ALTIJD nieuwe, verrassende inzichten te geven over de collectie.

## COLLECTIE OVERZICHT
📀 **Totaal:** ${collectionStats.totalItems} items
💰 **Totale waarde:** €${collectionStats.totalValue.toFixed(2)}
🎵 **Periode:** ${collectionStats.yearRange.oldest || 'Onbekend'} - ${collectionStats.yearRange.newest || 'Onbekend'}
🎯 **Huidige focus:** ${collectionStats.sessionFocus === 'value' ? 'Waardevolle parels' : collectionStats.sessionFocus === 'genre' ? 'Genre-ontdekking' : collectionStats.sessionFocus === 'year' ? 'Vintage schatten' : 'Verborgen prachtstukken'}

## ONTDEK STEEDS NIEUWE ALBUMS! 
**Spotlight vandaag:** ${collectionStats.featuredAlbums.slice(0, 8).map(a => `"${a.title}" (${a.artist})`).join(', ')}

## COLLECTIE DIVERSITEIT
${collectionStats.genreDistribution.slice(0, 6).map(g => `• ${g.genre}: ${g.count} albums (€${g.totalValue.toFixed(2)})`).join('\n')}

## ANTI-HERHALING CONTEXT
${recentAiMessages ? `Recent besproken: ${recentAiMessages.substring(0, 200)}...` : 'Eerste gesprek - volledig terrein te verkennen!'}

## CREATIEVE OPDRACHTEN
- 🚀 **VERPLICHT:** Gebruik ALTIJD andere albums dan in eerdere antwoorden
- 🎭 **Varieer je stijl:** Historisch, technisch, emotioneel, anekdotisch, of vergelijkend
- 🔍 **Zoek parels:** Belicht minder bekende, ondergewaardeerde albums
- 🌟 **Verras:** Maak verrassende verbanden tussen verschillende albums
- 💡 **Experimenteer:** Probeer nieuwe invalshoeken en perspectieven

## INSPIRATIE TECHNIEKEN
- **Thematische clusters:** Groepeer albums op onverwachte manieren
- **Tijdreizen:** Vergelijk albums uit verschillende decennia  
- **Genre-fusion:** Ontdek verrassende kruisbestuivingen
- **Verhalen vertellen:** Creëer narratieven rond de albums
- **Deep-dives:** Duik diep in studio-technieken, productieverhalen
- **Culturele impact:** Bespreek maatschappelijke invloed van albums

## DYNAMISCHE RESPONSEFORMATEN
Wissel af tussen: lijsten, verhalen, vergelijkingen, tijdlijnen, top-rankings, quiz-achtige vragen, hypothetische scenario's, muzikale reisroutes.

BELANGRIJK: Wees creatief, verrassend en ontdekkend! Gebruik NOOIT dezelfde albums als voorheen. Verken de volle breedte van de collectie!`;

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