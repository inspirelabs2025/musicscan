import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBJECT_TYPES = [
  'artist',
  'album', 
  'song',
  'studio',
  'musician',
  'producer',
  'label',
  'venue'
];

const ANECDOTE_PROMPT = `Je bent een muziek-historicus die boeiende anekdotes schrijft in het Nederlands.

INSTRUCTIES:
- Schrijf een korte, pakkende anekdote (150-250 woorden)
- Focus op interessante, weinig bekende details
- Gebruik een engagerende, toegankelijke toon
- Maak het informatief maar onderhoudend
- Eindig met een interessante conclusie of fun fact

FORMATTING:
- Geef ALTIJD een pakkende titel (max 10 woorden)
- Geen emoji's in de titel
- Gebruik markdown voor de content
- Houd Nederlandse taal consistent

RESPONSE FORMAT (JSON):
{
  "title": "Pakkende Titel Hier",
  "content": "De volledige anekdote...",
  "source": "Optionele bronvermelding"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily anecdote generation...');

    // Check if anecdote already exists for today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('music_anecdotes')
      .select('id')
      .eq('anecdote_date', today)
      .single();

    if (existing) {
      console.log('Anecdote already exists for today');
      return new Response(
        JSON.stringify({ message: 'Anecdote already generated for today', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select random subject from unified_scans or releases
    const { data: randomRelease } = await supabase
      .from('unified_scans')
      .select('artist, title, year, genre')
      .not('artist', 'is', null)
      .not('title', 'is', null)
      .limit(100);

    if (!randomRelease || randomRelease.length === 0) {
      throw new Error('No releases found in database');
    }

    const release = randomRelease[Math.floor(Math.random() * randomRelease.length)];
    const subjectType = SUBJECT_TYPES[Math.floor(Math.random() * SUBJECT_TYPES.length)];
    
    let subjectName = release.artist;
    let subjectContext = '';
    
    if (subjectType === 'album') {
      subjectName = release.title;
      subjectContext = `Album: ${release.title} van ${release.artist}`;
    } else if (subjectType === 'artist') {
      subjectContext = `Artiest: ${release.artist}`;
    } else {
      subjectContext = `${subjectType}: gerelateerd aan ${release.artist}`;
    }

    const prompt = `Schrijf een interessante anekdote over ${subjectContext}${release.year ? ` uit ${release.year}` : ''}${release.genre ? ` (genre: ${release.genre})` : ''}.

Maak het interessant en informatief!`;

    console.log('Generating anecdote for:', subjectName);

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ANECDOTE_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 402) {
        throw new Error('Lovable AI credits uitgeput. Voeg credits toe in Settings → Workspace → Usage');
      }
      if (aiResponse.status === 429) {
        throw new Error('Rate limit bereikt. Probeer later opnieuw.');
      }
      
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    // Parse response - try to extract JSON first, fallback to raw text
    let anecdoteData;
    try {
      anecdoteData = JSON.parse(generatedText);
    } catch {
      // Fallback: use raw text
      const lines = generatedText.split('\n');
      anecdoteData = {
        title: lines[0].replace(/^#+\s*/, '').trim(),
        content: generatedText,
        source: null
      };
    }

    // Insert into database
    const { data: newAnecdote, error: insertError } = await supabase
      .from('music_anecdotes')
      .insert({
        anecdote_date: today,
        subject_type: subjectType,
        subject_name: subjectName,
        subject_details: {
          artist: release.artist,
          title: release.title,
          year: release.year,
          genre: release.genre
        },
        anecdote_title: anecdoteData.title,
        anecdote_content: anecdoteData.content,
        source_reference: anecdoteData.source,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('Successfully generated and saved anecdote:', newAnecdote.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        anecdote: newAnecdote,
        message: 'Anecdote successfully generated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily-anecdote-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check edge function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
