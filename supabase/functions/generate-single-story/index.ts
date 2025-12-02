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

    // Prepare AI prompt with deep storytelling focus
    const prompt = `Genereer een rijk, gedetailleerd muziekverhaal in het Nederlands voor de single "${single_name}" van ${artist}.

Context:
- Artiest: ${artist}
${album ? `- Album: ${album}` : ''}
${year ? `- Jaar: ${year}` : ''}
${label ? `- Label: ${label}` : ''}
${genre ? `- Genre: ${genre}` : ''}
${styles && styles.length > 0 ? `- Stijlen: ${styles.join(', ')}` : ''}

BELANGRIJK: Schrijf een verhaal van 500-700 woorden met ECHTE DIEPGANG. Ga verder dan oppervlakkige feiten.

VERPLICHTE ELEMENTEN (indien beschikbaar):

1. **Studio & Productie**
   - In welke studio werd de single opgenomen?
   - Wie was de producer en wat was hun visie?
   - Welke opnametechnieken werden gebruikt?
   - Bijzonderheden over mixing en mastering
   - Opnamebudget en tijdsduur (indien bekend)

2. **Muzikanten & Credits**
   - Wie speelde welke instrumenten?
   - Gastmuzikanten of special guests
   - Backing vocals en koorpartijen
   - Strijkers, blazers of andere speciale bezettingen
   - Technische crew (engineers, assistenten)

3. **Samenwerkingen & Songwriting**
   - Wie schreef de song? (credits)
   - Co-writers en hun bijdragen
   - Ontstaan van de songwriting sessie
   - Features of gastoptredens
   - Invloed van andere artiesten

4. **Verhaal Achter de Single**
   - Wat inspireerde de artiest om dit nummer te schrijven?
   - Persoonlijke verhalen of gebeurtenissen
   - Anekdotes uit de studio
   - Problemen of uitdagingen tijdens opnames
   - Breakthrough momenten

5. **Visuele Elementen**
   - Videoclip: regisseur, concept, locaties
   - Artwork en hoes ontwerp
   - Fotografen en visual artists
   - Controverses of opmerkelijke visuele keuzes

6. **Impact & Ontvangst**
   - Chart prestaties (specifieke posities en landen)
   - Radiospel en streaming cijfers
   - Recensies van critici (citeer indien mogelijk)
   - Awards en nominaties
   - Cover versies door andere artiesten

7. **Culturele Context**
   - Wat gebeurde er in de muziekwereld toen dit uitkwam?
   - Hoe paste dit in de tijdsgeest?
   - Invloed op andere artiesten
   - Blijvende erfenis en relevantie

8. **B-kant & Bonus Tracks**
   - Wat stond er op de B-kant?
   - Verschillen tussen vinyl/CD/streaming versies
   - Demo versies of alternate takes
   - Remix versies en hun producers

SCHRIJFSTIJL:
- Begin met een pakkende opening die de lezer meteen in het verhaal trekt
- Gebruik levendige, concrete details (niet "er waren muzikanten" maar "gitarist John Smith speelde een vintage Fender Stratocaster")
- Citeer mensen waar mogelijk ("Volgens producer X...")
- Verweef technische details natuurlijk in het verhaal
- Eindig met reflectie op blijvende betekenis
- Gebruik storytelling technieken: span, conflict, oplossing
- Maak het persoonlijk en menselijk, niet klinisch

Vermijd vage termen zoals "populair", "succesvol", "bekend" zonder concrete voorbeelden.
Geef ALTIJD specifieke details wanneer je iets beweert.`;

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

    // Auto-post to Facebook
    try {
      console.log('📱 Auto-posting single to Facebook...');
      const singleUrl = `https://musicscan.nl/singles/${newStory.slug}`;
      const summary = storyContent.substring(0, 280).replace(/\n/g, ' ').trim() + '...';
      
      const fbResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-facebook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: 'blog',
          title: `🎵 ${artist} - ${single_name}`,
          content: summary,
          url: singleUrl,
          image_url: artworkUrl,
          hashtags: ['Singles', 'MuziekVerhaal', year ? `${year}s` : null].filter(Boolean)
        })
      });

      if (fbResponse.ok) {
        console.log('✅ Facebook post created for single');
      } else {
        console.log('⚠️ Facebook post failed:', await fbResponse.text());
      }
    } catch (fbError) {
      console.error('❌ Facebook auto-post error:', fbError);
      // Don't fail the whole request for FB errors
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
