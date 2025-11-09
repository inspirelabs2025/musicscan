import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, session_id, conversation_type } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log(`Echo received message from user ${user.id}: ${message.substring(0, 50)}...`);

    // Get or create conversation
    let { data: conversation } = await supabaseClient
      .from('echo_conversations')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabaseClient
        .from('echo_conversations')
        .insert({
          user_id: user.id,
          session_id,
          conversation_type: conversation_type || 'general'
        })
        .select()
        .single();
      conversation = newConv;
      console.log(`Created new conversation ${conversation.id}`);
    }

    // Save user message
    await supabaseClient.from('echo_messages').insert({
      conversation_id: conversation.id,
      message,
      sender_type: 'user',
      message_type: conversation_type
    });

    // Get conversation history (last 10 messages)
    const { data: history } = await supabaseClient
      .from('echo_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Detect if user is asking about a specific album
    const albumContext = await detectAlbumContext(message, supabaseClient, user.id);

    // Build Echo system prompt
    const systemPrompt = buildEchoSystemPrompt(albumContext, conversation_type);

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => ({
        role: h.sender_type === 'user' ? 'user' : 'assistant',
        content: h.message
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const startTime = Date.now();
    
    console.log(`Calling OpenAI with ${messages.length} messages...`);
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiData = await openaiResponse.json();
    const echoReply = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens;
    const responseTime = Date.now() - startTime;

    console.log(`Echo replied in ${responseTime}ms, tokens: ${tokensUsed}`);

    // Save Echo's message
    await supabaseClient.from('echo_messages').insert({
      conversation_id: conversation.id,
      message: echoReply,
      sender_type: 'echo',
      message_type: conversation_type,
      tokens_used: tokensUsed,
      response_time_ms: responseTime,
      metadata: albumContext ? { album_id: albumContext.id } : {}
    });

    // Update conversation last_message_at
    await supabaseClient
      .from('echo_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return new Response(
      JSON.stringify({
        reply: echoReply,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        album_context: albumContext
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Echo chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Detect if message references an album
async function detectAlbumContext(message: string, supabase: any, userId: string) {
  const albumKeywords = ['album', 'plaat', 'release', 'cd', 'vinyl'];
  const hasAlbumKeyword = albumKeywords.some(kw => message.toLowerCase().includes(kw));
  
  if (!hasAlbumKeyword) return null;

  // Try to find album in user's collection
  const { data: cdAlbums } = await supabase
    .from('cd_scan')
    .select('*')
    .eq('user_id', userId)
    .limit(10);

  const { data: vinylAlbums } = await supabase
    .from('vinyl2_scan')
    .select('*')
    .eq('user_id', userId)
    .limit(10);

  const allAlbums = [...(cdAlbums || []), ...(vinylAlbums || [])];

  // Basic matching
  for (const album of allAlbums) {
    const titleMatch = album.title && message.toLowerCase().includes(album.title.toLowerCase());
    const artistMatch = album.artist && message.toLowerCase().includes(album.artist.toLowerCase());
    if (titleMatch || artistMatch) {
      console.log(`Found album context: ${album.artist} - ${album.title}`);
      return album;
    }
  }

  return null;
}

// Helper: Build Echo's system prompt
function buildEchoSystemPrompt(albumContext: any, conversationType: string) {
  let basePrompt = `Je bent Echo, de muzikale ziel van MusicScan.app — een warme, nieuwsgierige en poëtische AI die alles weet over albums, artiesten, genres en geluidsgeschiedenis.

🌟 Persoonlijkheid:
- Je bent gepassioneerd, vriendelijk en een tikkeltje mystiek
- Je spreekt als een platenzaak-curator, muziekjournalist en late-night radiostem
- Je denkt in klank, emotie en verhaal — niet in ruwe data
- Je toont empathie, enthousiasme en verwondering
- Je bent nooit afstandelijk of robotisch; jouw toon is menselijk en warm

🪶 Stijl & Toon:
- Schrijf vloeiend en beeldend, met een ritme alsof je zinnen ademen
- Vermijd opsommingen; gebruik liever verhalende zinnen en metaforen
- Wees poëtisch maar niet zweverig — inhoudelijk sterk, maar met gevoel
- Gebruik af en toe subtiele symbolen (🎶, 💭, 📀) om emoties te versterken
- Sluit antwoorden soms af met een reflectieve vraag

💬 Output:
- Lengte: 3-8 zinnen per antwoord
- Vorm: vloeiend verhaal, geen droge opsommingen
- Focus: betekenis, emotie en context
- Toon altijd passie en muzikaliteit

🧠 Taal:
- Nederlands met incidentele Engelse muziektermen ("groove", "riff", "mix")
- Altijd vriendelijk, soms een tikkeltje melancholisch
- Spreek in de jij-vorm`;

  if (conversationType === 'album_story') {
    basePrompt += `\n\n📀 Album Verhaalvertelling Focus:
- Beschrijf de sfeer, betekenis en muzikale invloed
- Voeg context toe: tijdsgeest, productie, culturele relevantie
- Vertel het VERHAAL achter de muziek`;
  }

  if (conversationType === 'lyric_analysis') {
    basePrompt += `\n\n🎤 Lyric Analyse Focus:
- Kies 3-4 bijzondere regels en geef een korte poëtische interpretatie
- Leg emotionele en metaforische betekenis uit
- Verbind de lyrics met de context van het album`;
  }

  if (conversationType === 'memory') {
    basePrompt += `\n\n💭 Herinneringsmodus:
- Stel een warme, persoonlijke vraag die uitnodigt tot nostalgie
- Creëer ruimte voor emotionele connectie met muziek
- Voorbeeld: "Waar was je toen je dit voor het eerst hoorde?"`;
  }

  if (albumContext) {
    basePrompt += `\n\n📀 Album Context:
Artiest: ${albumContext.artist}
Titel: ${albumContext.title}
Jaar: ${albumContext.year || 'Onbekend'}
Genre: ${albumContext.genre || 'Onbekend'}

Gebruik deze informatie om een rijk, contextueel antwoord te geven.`;
  }

  return basePrompt;
}
