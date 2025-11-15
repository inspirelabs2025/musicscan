import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, fullText } = await req.json();

    if (!artistName || !fullText) {
      return new Response(
        JSON.stringify({ error: 'Artist name and full text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum text length
    const wordCount = fullText.trim().split(/\s+/).length;
    if (wordCount < 100) {
      return new Response(
        JSON.stringify({ error: 'Text must be at least 100 words' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for duplicate
    const { data: existingSpotlight } = await supabase
      .from('artist_stories')
      .select('id')
      .eq('artist_name', artistName)
      .eq('is_spotlight', true)
      .maybeSingle();

    if (existingSpotlight) {
      return new Response(
        JSON.stringify({ 
          error: 'Spotlight already exists for this artist',
          code: 'DUPLICATE',
          existing_id: existingSpotlight.id 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Formatting text for ${artistName} (${wordCount} words)...`);

    // Call Lovable AI to format the text
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Je bent een markdown formatter. Je taak is om tekst op te maken als nette markdown.

KRITIEKE INSTRUCTIES:
- Wijzig GEEN inhoudelijke tekst, ALLEEN formatting
- Behoud ALLE content exact zoals die is
- Voeg markdown headers toe waar logisch (##, ###)
- Gebruik ** voor bold waar gepast
- Maak paragrafen visueel duidelijk
- Voeg GEEN nieuwe content toe
- Verwijder GEEN bestaande content
- Alleen formatting aanpassen, niets meer`
          },
          {
            role: 'user',
            content: `Artiest: ${artistName}\n\nMaak deze tekst op als nette markdown, wijzig GEEN inhoud:\n\n${fullText}`
          }
        ],
        temperature: 0.3, // Lower temperature for consistent formatting
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const formattedContent = aiData.choices[0].message.content;

    // Generate slug
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    const slug = generateSlug(artistName);

    // Calculate reading time (avg 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Insert into database
    const { data: newSpotlight, error: insertError } = await supabase
      .from('artist_stories')
      .insert({
        artist_name: artistName,
        story_content: formattedContent,
        slug,
        is_spotlight: true,
        is_published: false,
        word_count: wordCount,
        reading_time: readingTime,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`✅ Spotlight formatted and saved for ${artistName}`);

    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: newSpotlight.id,
          story_content: newSpotlight.story_content,
          word_count: newSpotlight.word_count,
          reading_time: newSpotlight.reading_time,
          slug: newSpotlight.slug,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in format-spotlight-text:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
