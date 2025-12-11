import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { artist, song_title, album, year, country_origin, decade, youtube_video_id, is_classic, tags } = await req.json();

    if (!artist || !song_title) {
      throw new Error('Artist and song_title are required');
    }

    console.log(`🎄 Generating Christmas story for: ${artist} - ${song_title}`);

    // Generate slug
    const slug = `${artist}-${song_title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if story already exists
    const { data: existingStory } = await supabase
      .from('music_stories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingStory) {
      console.log(`Story already exists for ${artist} - ${song_title}`);
      return new Response(JSON.stringify({ 
        success: true, 
        story_id: existingStory.id,
        message: 'Story already exists' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build prompt for AI
    const prompt = `Je bent een enthousiaste Nederlandse muziekjournalist die gespecialiseerd is in kerstmuziek. 
Schrijf een boeiend verhaal over de kerstsingle "${song_title}" van ${artist}.

CONTEXT:
- Artiest: ${artist}
- Nummer: ${song_title}
- Album: ${album || 'Onbekend'}
- Jaar: ${year || 'Onbekend'}
- Land: ${country_origin || 'Onbekend'}
- Decennium: ${decade || 'Onbekend'}
- Klassiek: ${is_classic ? 'Ja, een echte kerstklassieker!' : 'Nee'}
${youtube_video_id ? `- YouTube Video ID: ${youtube_video_id}` : ''}

SCHRIJF OVER (in het Nederlands):
1. **Het Ontstaan** - Hoe kwam dit nummer tot stand? Wat was de inspiratie?
2. **De Opname** - Waar en hoe is het opgenomen? Interessante studio-details?
3. **De Videoclip** - Als er een iconische videoclip is, beschrijf de making-of
4. **Culturele Impact** - Waarom is dit nummer zo geliefd met kerst?
5. **Leuke Weetjes** - Verrassende feiten, trivia, behind-the-scenes verhalen
6. **Muzikale Analyse** - Wat maakt dit nummer muzikaal bijzonder?

STIJL:
- Schrijf in het Nederlands
- Enthousiast maar informatief
- Gebruik markdown formatting (## voor koppen)
- Minimaal 800 woorden
- Voeg concrete details toe (geen vage beschrijvingen)
- Maak het persoonlijk en leesbaar`;

    // Call AI API
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Je bent een Nederlandse muziekjournalist gespecialiseerd in kerstmuziek. Schrijf altijd in het Nederlands.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const storyContent = aiData.choices?.[0]?.message?.content || '';

    if (!storyContent) {
      throw new Error('No content generated from AI');
    }

    console.log(`✅ Generated ${storyContent.split(' ').length} words for ${artist} - ${song_title}`);

    // Calculate reading time
    const wordCount = storyContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Build YAML frontmatter
    const yamlFrontmatter = {
      title: song_title,
      artist: artist,
      album: album,
      year: year,
      genre: 'Christmas',
      country: country_origin,
      decade: decade,
      is_christmas: true,
      is_classic: is_classic,
      youtube_video_id: youtube_video_id,
      tags: tags || ['christmas', 'kerst'],
    };

    // System user ID for batch-generated content
    const systemUserId = '567d3376-a797-447c-86cb-4c2f1260e997';
    
    // Insert into music_stories
    const { data: newStory, error: insertError } = await supabase
      .from('music_stories')
      .insert({
        slug,
        user_id: systemUserId,
        query: `${artist} - ${song_title}`,
        title: `${artist} - ${song_title}`, // Required title field
        artist: artist,
        single_name: song_title,
        story_content: storyContent,
        yaml_frontmatter: yamlFrontmatter,
        reading_time: readingTime,
        is_published: true,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log(`🎄 Story created with ID: ${newStory.id}`);

    // Step 2: Fetch artwork
    let artworkUrl = null;
    try {
      const artworkResult = await supabase.functions.invoke('fetch-album-artwork', {
        body: { artist, title: song_title, storyId: newStory.id }
      });
      artworkUrl = artworkResult?.data?.artwork_url;
      console.log(`🖼️ Artwork fetched: ${artworkUrl}`);
    } catch (artworkError) {
      console.log('Artwork fetch failed (non-critical):', artworkError);
    }

    // Step 3: Create poster product
    let productId = null;
    try {
      const productResult = await supabase.functions.invoke('create-poster-product', {
        body: { 
          artist, 
          title: song_title, 
          image_url: artworkUrl,
          tags: ['christmas', 'kerst', 'poster'],
          category: 'POSTER'
        }
      });
      productId = productResult?.data?.product_id;
      console.log(`🛍️ Product created: ${productId}`);
    } catch (productError) {
      console.log('Product creation failed (non-critical):', productError);
    }

    // Step 4: Queue Facebook auto-post
    try {
      const singleUrl = `https://www.musicscan.app/singles/${slug}`;
      await supabase.from('singles_facebook_queue').insert({
        music_story_id: newStory.id,
        artist: artist,
        title: song_title,
        image_url: artworkUrl,
        story_url: singleUrl,
        status: 'pending',
        priority: 100, // High priority for new content
        scheduled_for: new Date().toISOString()
      });
      console.log(`📘 Facebook post queued for: ${artist} - ${song_title}`);
    } catch (fbError) {
      console.log('Facebook queue failed (non-critical):', fbError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      story_id: newStory.id,
      slug,
      word_count: wordCount,
      reading_time: readingTime,
      artwork_url: artworkUrl,
      product_id: productId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating Christmas story:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
