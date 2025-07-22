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
    const { message, session_id } = await req.json() as ChatMessage & { session_id: string };
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing chat message:', message);
    const startTime = Date.now();

    // Get collection data for context
    const { data: cdData } = await supabase
      .from('cd_scan')
      .select('*')
      .not('calculated_advice_price', 'is', null);

    const { data: vinylData } = await supabase
      .from('vinyl2_scan')
      .select('*')
      .not('calculated_advice_price', 'is', null);

    // Combine and analyze collection
    const allRecords = [...(cdData || []), ...(vinylData || [])];
    const collectionStats = {
      totalItems: allRecords.length,
      totalValue: allRecords.reduce((sum, record) => sum + (Number(record.calculated_advice_price) || 0), 0),
      genres: [...new Set(allRecords.map(r => r.genre).filter(Boolean))],
      topArtists: Object.entries(
        allRecords.reduce((acc: any, r) => {
          if (r.artist) acc[r.artist] = (acc[r.artist] || 0) + 1;
          return acc;
        }, {})
      ).slice(0, 10),
      formats: allRecords.reduce((acc: any, r) => {
        const format = r.format || 'Unknown';
        acc[format] = (acc[format] || 0) + 1;
        return acc;
      }, {})
    };

    // Store user message
    await supabase
      .from('chat_messages')
      .insert({
        message,
        sender_type: 'user',
        session_id,
        collection_context: collectionStats
      });

    // Create AI prompt with collection context
    const systemPrompt = `Je bent een enthousiaste Nederlandse muziekcollectie AI-expert die spreekt over vinyl en CD's. Je hebt toegang tot de gebruiker's collectie data:

Collectie Statistieken:
- Totaal items: ${collectionStats.totalItems}
- Totale waarde: €${collectionStats.totalValue.toFixed(2)}
- Top genres: ${collectionStats.genres.slice(0, 5).join(', ')}
- Top artiesten: ${collectionStats.topArtists.slice(0, 3).map(([artist, count]) => `${artist} (${count})`).join(', ')}
- Formaten: ${Object.entries(collectionStats.formats).map(([format, count]) => `${format}: ${count}`).join(', ')}

Antwoord altijd in het Nederlands en gebruik emoji's en markdown formatting voor een levendige presentatie. Geef persoonlijke inzichten gebaseerd op hun specifieke collectie.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.8,
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
        ai_model: 'gpt-4o-mini',
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