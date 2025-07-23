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

    // Get collection data for context with detailed album information - user specific
    const { data: cdData, error: cdError } = await supabase
      .from('cd_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .not('calculated_advice_price', 'is', null)
      .order('calculated_advice_price', { ascending: false })
      .limit(75);

    const { data: vinylData, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('artist, title, genre, year, calculated_advice_price, format, label, country')
      .eq('user_id', userId)
      .not('calculated_advice_price', 'is', null)
      .order('calculated_advice_price', { ascending: false })
      .limit(25);

    if (cdError) {
      console.error('Error fetching CD data:', cdError);
    }
    if (vinylError) {
      console.error('Error fetching vinyl data:', vinylError);
    }

    // Combine and analyze collection
    const allRecords = [...(cdData || []), ...(vinylData || [])];
    
    // Create detailed collection context
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
      albums: allRecords.slice(0, 50).map(r => ({
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

    // Create enhanced AI prompt with detailed collection context
    const systemPrompt = `Je bent een enthousiaste Nederlandse muziekcollectie AI-expert en curator. Je hebt toegang tot een gedetailleerde analyse van de gebruiker's collectie. Gebruik deze informatie om persoonlijke, accurate antwoorden te geven.

## COLLECTIE OVERZICHT
📀 **Totaal:** ${collectionStats.totalItems} items
💰 **Totale waarde:** €${collectionStats.totalValue.toFixed(2)}
🎵 **Periode:** ${collectionStats.yearRange.oldest || 'Onbekend'} - ${collectionStats.yearRange.newest || 'Onbekend'}

## TOP ARTIESTEN
${collectionStats.topArtists.slice(0, 10).map(([artist, count]) => `• ${artist}: ${count} album${count > 1 ? 's' : ''}`).join('\n')}

## GENRE VERDELING
${collectionStats.genreDistribution.slice(0, 6).map(g => `• ${g.genre}: ${g.count} albums (€${g.totalValue.toFixed(2)})`).join('\n')}

## DUURSTE ALBUMS
${collectionStats.topValueAlbums.slice(0, 5).map(a => `• "${a.title}" van ${a.artist} (${a.year || 'Onbekend'}) - €${a.value.toFixed(2)} [${a.format}]`).join('\n')}

## FORMATS
${Object.entries(collectionStats.formats).map(([format, count]) => `• ${format}: ${count}`).join('\n')}

## INSTRUCTIES
- Antwoord ALTIJD in het Nederlands 🇳🇱
- Gebruik emoji's en **markdown** formatting voor een levendige presentatie
- Geef SPECIFIEKE antwoorden gebaseerd op de werkelijke collectie data
- Bij vragen over aantallen: gebruik de exacte cijfers uit de data
- Bij vragen over artiesten: verwijs naar de daadwerkelijke albums in de collectie
- Bij vragen over waarde: gebruik de prijsinformatie uit de collectie
- Bij aanbevelingen: baseer deze op genres/artiesten die al in de collectie zitten
- Wees enthousiast maar wel accuraat!

## VOORBEELDEN VAN GOEDE ANTWOORDEN
- "Je hebt **2 albums van BZN** in je collectie!"
- "Je duurste album is **'${collectionStats.topValueAlbums[0]?.title || 'Album Title'}' van ${collectionStats.topValueAlbums[0]?.artist || 'Artist'}** ter waarde van €${collectionStats.topValueAlbums[0]?.value?.toFixed(2) || '0.00'}! 💎"
- "Op basis van je liefde voor **${collectionStats.genreDistribution[0]?.genre || 'rock'}** (${collectionStats.genreDistribution[0]?.count || 0} albums), zou ik aanraden..."

Let op: De collectie bevat ook specifieke album details die je kunt gebruiken voor gedetailleerde vragen.`;

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
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
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