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

const EXTENDED_PROMPT = `Je bent een muziek-historicus die diepgaande artikelen schrijft.

INSTRUCTIES:
- Schrijf een uitgebreid verhaal van 500-800 woorden
- Duik dieper in de context, achtergrond, en impact
- Voeg interessante details, quotes, en anekdotes toe
- Gebruik subkopjes (## Markdown) voor structuur
- Maak het toegankelijk maar informatief
- Eindig met een reflectie of legacy paragraaf

FORMATTING:
- Gebruik Markdown met koppen (##, ###)
- Voeg quotes toe met > blockquotes
- Gebruik **bold** voor belangrijke namen/termen
- Structuur: Intro → Context → Verhaal → Impact → Legacy

RESPONSE FORMAT (JSON):
{
  "content": "Volledige uitgebreide inhoud in markdown...",
  "reading_time": 3
}`;

const generateSEOFriendlySlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
};

// Helper function to extract JSON from markdown code blocks
const extractJSON = (text: string): any => {
  // Try to find JSON in markdown code fences
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse JSON from code fence:', e);
    }
  }
  
  // Try direct JSON parse
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Last resort: return null to trigger fallback
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily anecdote generation...');

    // Get request body to check for force flag
    const url = new URL(req.url);
    const forceParam = url.searchParams.get('force');
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const forceGenerate = body.force === true || forceParam === 'true' || forceParam === '1';

    // Check if anecdote already exists for today (skip if force=true)
    const today = new Date().toISOString().split('T')[0];
    if (!forceGenerate) {
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
    } else {
      console.log('Force generation enabled - generating additional anecdote for today');
    }

    // Select random artist from curated_artists for diverse international coverage
    const { data: curatedArtists } = await supabase
      .from('curated_artists')
      .select('artist_name')
      .eq('is_active', true)
      .limit(200);

    if (!curatedArtists || curatedArtists.length === 0) {
      throw new Error('No curated artists found in database');
    }

    const randomArtist = curatedArtists[Math.floor(Math.random() * curatedArtists.length)];
    const subjectType = SUBJECT_TYPES[Math.floor(Math.random() * SUBJECT_TYPES.length)];
    
    const subjectName = randomArtist.artist_name;
    let subjectContext = '';
    
    if (subjectType === 'artist') {
      subjectContext = `Artiest: ${subjectName}`;
    } else if (subjectType === 'album') {
      subjectContext = `Een bekend album van ${subjectName}`;
    } else if (subjectType === 'song') {
      subjectContext = `Een bekend nummer van ${subjectName}`;
    } else {
      subjectContext = `${subjectType}: gerelateerd aan ${subjectName}`;
    }

    const prompt = `Schrijf een interessante anekdote over ${subjectContext}.

Maak het interessant en informatief! Kies zelf een interessante periode of album om over te schrijven.`;

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

    // Parse response - extract JSON from markdown if present
    let anecdoteData = extractJSON(generatedText);

    if (!anecdoteData || !anecdoteData.title || !anecdoteData.content) {
      // Fallback: use raw text
      console.warn('Could not parse JSON, using fallback parsing');
      const lines = generatedText.split('\n').filter(l => l.trim());
      anecdoteData = {
        title: lines[0].replace(/^#+\s*/, '').replace(/```json/g, '').trim(),
        content: generatedText.replace(/```json/g, '').replace(/```/g, '').trim(),
        source: null
      };
    }

    console.log('Parsed anecdote title:', anecdoteData.title);
    console.log('Generating extended content for:', subjectName);

    // Generate extended content with second AI call
    const extendedResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXTENDED_PROMPT },
          { 
            role: 'user', 
            content: `Schrijf een uitgebreid artikel over: ${subjectContext}

Korte samenvatting als basis:
${anecdoteData.content}

Maak het uitgebreider en diepgaander!` 
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!extendedResponse.ok) {
      console.error('Extended content generation failed:', extendedResponse.status);
      throw new Error(`Extended content AI error: ${extendedResponse.statusText}`);
    }

    const extendedAiData = await extendedResponse.json();
    const extendedText = extendedAiData.choices[0].message.content;

    let extendedData = extractJSON(extendedText);

    if (!extendedData || !extendedData.content) {
      console.warn('Could not parse extended JSON, using fallback');
      extendedData = {
        content: extendedText.replace(/```json/g, '').replace(/```/g, '').trim(),
        reading_time: Math.ceil(extendedText.replace(/```json/g, '').replace(/```/g, '').length / 1000)
      };
    }

    console.log('Extended content length:', extendedData.content.length, 'chars');

    // Generate SEO-friendly slug
    const slug = generateSEOFriendlySlug(anecdoteData.title) + '-' + Date.now().toString().slice(-6);
    const metaDescription = anecdoteData.content.slice(0, 155) + '...';

    // Insert into database with extended content and SEO fields
    const { data: newAnecdote, error: insertError } = await supabase
      .from('music_anecdotes')
      .insert({
        anecdote_date: today,
        subject_type: subjectType,
        subject_name: subjectName,
        subject_details: {
          artist: subjectName
        },
        anecdote_title: anecdoteData.title,
        anecdote_content: anecdoteData.content,
        extended_content: extendedData.content,
        slug: slug,
        meta_title: `${anecdoteData.title} | MusicScan Muziek Anekdotes`,
        meta_description: metaDescription,
        reading_time: extendedData.reading_time || Math.ceil(extendedData.content.length / 1000),
        source_reference: anecdoteData.source,
        is_active: true,
        views_count: 0
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('Successfully generated and saved anecdote:', newAnecdote.id);

    // Auto-post to Facebook and Instagram
    const anecdoteUrl = `https://www.musicscan.app/anekdotes/${newAnecdote.slug}`;
    const postContent = newAnecdote.anecdote_content.substring(0, 400) + '...';
    const postHashtags = ['MusicScan', 'MuziekAnekdote', subjectName.replace(/\s+/g, ''), 'Muziek', 'MuziekGeschiedenis'];
    
    // Default image for social posts (can be replaced with generated image later)
    const defaultImageUrl = 'https://www.musicscan.app/og-image.png';
    
    // Post to Facebook
    try {
      const fbResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          content_type: 'anecdote',
          title: newAnecdote.anecdote_title,
          content: postContent,
          url: anecdoteUrl,
          hashtags: postHashtags
        })
      });
      
      const fbResult = await fbResponse.json();
      if (fbResult.success) {
        console.log('✅ Successfully posted anecdote to Facebook:', fbResult.post_id);
      } else {
        console.warn('⚠️ Facebook post failed:', fbResult.error);
      }
    } catch (fbError) {
      console.error('❌ Error posting to Facebook:', fbError);
    }
    
    // Post to Instagram (requires image)
    try {
      const igResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          content_type: 'anecdote',
          title: newAnecdote.anecdote_title,
          content: postContent,
          url: anecdoteUrl,
          image_url: defaultImageUrl,
          hashtags: postHashtags
        })
      });
      
      const igResult = await igResponse.json();
      if (igResult.success) {
        console.log('✅ Successfully posted anecdote to Instagram:', igResult.post_id);
      } else {
        console.warn('⚠️ Instagram post failed:', igResult.error);
      }
    } catch (igError) {
      console.error('❌ Error posting to Instagram:', igError);
    }

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
