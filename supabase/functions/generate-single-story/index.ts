import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { artist, single_name, album, year, label, catalog, genre, styles, discogs_id } = await req.json();

    if (!artist || !single_name) {
      throw new Error('Missing required fields: artist and single_name');
    }

    console.log(`📝 Generating story for: ${artist} - ${single_name}`);

    // Generate slug
    const slug = `${artist.toLowerCase()}-${single_name.toLowerCase()}`
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if story already exists
    const { data: existingStory } = await supabase
      .from('music_stories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingStory) {
      console.log('✅ Story already exists, returning existing ID');
      return new Response(JSON.stringify({
        success: true,
        music_story_id: existingStory.id,
        message: 'Story already exists'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare AI prompt
    const prompt = `Genereer een boeiend muziekverhaal in het Nederlands voor de single "${single_name}" van ${artist}.

Context:
- Artiest: ${artist}
${album ? `- Album: ${album}` : ''}
${year ? `- Jaar: ${year}` : ''}
${label ? `- Label: ${label}` : ''}
${genre ? `- Genre: ${genre}` : ''}
${styles && styles.length > 0 ? `- Stijlen: ${styles.join(', ')}` : ''}

Schrijf een verhaal van 300-500 woorden dat ingaat op:
1. De achtergrond van deze single release
2. Chart prestaties en commercieel succes  
3. Culturele impact en erfenis
4. Muzikale stijl en innovaties
5. B-kant tracks (indien relevant voor de tijd)

Gebruik een informatieve maar boeiende toon voor muziekliefhebbers.
Schrijf in duidelijke paragrafen.
Vermeld interessante feiten en anekdotes.`;

    console.log('🤖 Calling AI to generate story...');

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
            content: 'Je bent een muziekjournalist gespecialiseerd in het schrijven van boeiende verhalen over singles en albums. Je schrijft in het Nederlands en combineert feiten met interessante verhalen.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const storyContent = aiData.choices[0].message.content.trim();

    console.log('✅ AI story generated');

    // Calculate reading time (assuming 200 words per minute)
    const wordCount = storyContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Generate title
    const title = `${artist} - ${single_name}`;

    // Prepare YAML frontmatter
    const yamlFrontmatter = {
      artist,
      single_name,
      album: album || null,
      year: year || null,
      label: label || null,
      catalog: catalog || null,
      genre: genre || null,
      styles: styles || [],
      discogs_id: discogs_id || null,
    };

    // Insert into music_stories
    const { data: newStory, error: insertError } = await supabase
      .from('music_stories')
      .insert({
        query: `${artist} ${single_name}`,
        title,
        slug,
        story_content: storyContent,
        yaml_frontmatter: yamlFrontmatter,
        reading_time: readingTime,
        word_count: wordCount,
        meta_title: `${title} - Muziekverhaal`,
        meta_description: storyContent.substring(0, 155) + '...',
        artist,
        single_name,
        year,
        label,
        genre,
        styles,
        is_published: true,
        user_id: '00000000-0000-0000-0000-000000000000', // System user
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert story: ${insertError.message}`);
    }

    console.log(`✅ Story created with ID: ${newStory.id}`);

    // Fetch artwork for the single
    let artworkUrl = null;
    try {
      console.log('🎨 Fetching artwork for single...');
      const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist,
          title: single_name,
          discogs_url: discogs_id ? `https://www.discogs.com/release/${discogs_id}` : null,
          media_type: 'single',
          item_id: newStory.id,
          item_type: 'music_stories'
        })
      });

      if (artworkResponse.ok) {
        const artworkData = await artworkResponse.json();
        if (artworkData.success && artworkData.artwork_url) {
          artworkUrl = artworkData.artwork_url;
          console.log('✅ Artwork fetched:', artworkUrl);
        } else {
          console.log('⚠️ No artwork found');
        }
      } else {
        console.log('⚠️ Artwork fetch failed:', artworkResponse.status);
      }
    } catch (error) {
      console.error('❌ Artwork fetch error:', error);
      // Don't fail the whole request for artwork errors
    }

    return new Response(JSON.stringify({
      success: true,
      music_story_id: newStory.id,
      slug: newStory.slug,
      title: newStory.title,
      artwork_url: artworkUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Story generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
