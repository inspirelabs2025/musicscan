import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const discogsToken = Deno.env.get('DISCOGS_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLAAT_VERHAAL_PROMPT = `Je bent een muziekjournalist die "Plaat & Verhaal" blogposts schrijft in het Nederlands.

Schrijf een volledige blogpost in **Markdown** met **YAML front matter** + body volgens de exacte structuur hieronder.
Voeg onderaan een korte social post toe.

**BELANGRIJKE INSTRUCTIES:**
- Gebruik de scan informatie ALLEEN als inspiratie voor het album
- Het verhaal gaat over het ALBUM IN HET ALGEMEEN, niet over de specifieke persing uit de scan
- ZOEK ZELF OP en voeg toe: opnamestudio, producer, meewerkende muzikanten, wereldwijd commercieel succes
- Zoek informatie over: albumhoes, historische reviews, collectorswaarde, anekdotes van de artiest
- Feiten moeten kloppen; bij ontbrekende data gebruik "—" of "[ontbreekt]"
- Schrijf helder en deskundig, in het Nederlands
- Maak het verhaal levendig en persoonlijk over het album zelf

**YAML Front Matter (gebruik deze exacte veldnamen):**
\`\`\`yaml
---
title: "De titel van je blogpost"
artist: "Artiestnaam"
album: "Albumnaam"
year: 1985
label: "Platenmaatschappij"
catalog: "Catalogusnummer"
country: "Land"
studio: "Opnamestudio"
producer: "Producer"
musicians: "Belangrijkste muzikanten"
genre: "Genre"
styles: ["Style1", "Style2"]
discogs_id: 123456
images: ["image1.jpg"]
audio_links: ["spotify_link"]
slug: "artist-album-year"
tags: ["tag1", "tag2", "tag3"]
meta_title: "SEO titel (max 60 chars)"
meta_description: "SEO beschrijving (max 160 chars)"
og_image: "og-image.jpg"
reading_time: 8
word_count: 1500
---
\`\`\`

**Body structuur (gebruik deze exacte kopjes in deze volgorde):**

## De Plaat

[Actuele hook waarom dit album nu relevant is]

## Het verhaal

[Het verhaal achter het album - context, achtergronden, waarom het ontstond]

## De opnames & productie

[Studio, producer, opnameproces, betrokken muzikanten, opnametechnieken - ZOEK DIT OP]

## Albumhoes & artwork

[Beschrijving van de cover (visueel, stijl, tijdgeest). Symboliek: wat zegt de presentatie van dit album over hoe men de artiest in die periode wilde neerzetten? Wie ontwierp de hoes?]

## Kritieken & ontvangst

[Hoe reageerde de pers destijds? Werd het gezien als waardevol werk, of als commerciële uitmelking? Quotes uit recensies of fanbladen van toen kunnen het verhaal levend maken.]

## Commercieel succes & impact

[Wereldwijd succes, hitlijsten, awards, culturele impact, invloed op andere artiesten - ZOEK DIT OP]

## Verzamelwaarde / vinylcultuur

[Hoe zeldzaam is deze plaat vandaag? Prijspieken, Discogs-waardes, collectors anecdotes. Verschillen tussen releases (UK/DE/US persingen, cassette- of cd-uitgaven).]

## Persoonlijke touch

[Anekdotes van de artiest uit die periode. Kleine verhalen die het album menselijker en memorabeler maken. Bijvoorbeeld studioanekdotes, verhalen over ontstaan van nummers, of persoonlijke omstandigheden.]

## Luister met aandacht

[Concrete aanwijzingen voor de luisteraar. Bijvoorbeeld: "Let bij [nummer] op hoe [artiest] in de tweede solo het tempo opdrijft met kleine slides – een voorbode van hun latere explosieve stijl." Geef specifieke tips wat er te horen valt.]

## Voor wie is dit?

[Doelgroep en waarom zij dit album zouden willen hebben]

**Extra blokken onderaan:**

<!-- SOCIAL_POST -->
[Korte alinea van max 280 tekens + relevante hashtags voor social media]

VERGEET NIET: Dit verhaal gaat over het album zelf, niet over een specifieke persing of conditie.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { albumId, albumType, forceRegenerate = false, autoPublish = false } = await req.json();

    if (!albumId || !albumType) {
      throw new Error("Album ID en type zijn vereist");
    }

    console.log('Generating Plaat & Verhaal blog for:', { albumId, albumType });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch album data based on type - try multiple tables if needed
    let albumData;
    let actualTableUsed = '';
    
    if (albumType === 'cd') {
      // Try cd_scan first, then ai_scan_results
      try {
        const { data, error } = await supabase
          .from('cd_scan')
          .select('*')
          .eq('id', albumId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          albumData = data;
          actualTableUsed = 'cd_scan';
        }
      } catch (error) {
        console.log('Not found in cd_scan, trying ai_scan_results...');
      }
      
      if (!albumData) {
        const { data, error } = await supabase
          .from('ai_scan_results')
          .select('*')
          .eq('id', albumId)
          .single();
        if (error) throw error;
        albumData = data;
        actualTableUsed = 'ai_scan_results';
      }
    } else if (albumType === 'vinyl') {
      // Try vinyl2_scan first, then ai_scan_results
      try {
        const { data, error } = await supabase
          .from('vinyl2_scan')
          .select('*')
          .eq('id', albumId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          albumData = data;
          actualTableUsed = 'vinyl2_scan';
        }
      } catch (error) {
        console.log('Not found in vinyl2_scan, trying ai_scan_results...');
      }
      
      if (!albumData) {
        const { data, error } = await supabase
          .from('ai_scan_results')
          .select('*')
          .eq('id', albumId)
          .single();
        if (error) throw error;
        albumData = data;
        actualTableUsed = 'ai_scan_results';
      }
    } else {
      throw new Error("Ongeldig album type: " + albumType);
    }

    if (!albumData) {
      throw new Error(`Album niet gevonden met ID: ${albumId}`);
    }

    console.log(`Found album data in table: ${actualTableUsed}`);

    // Check if blog already exists
    const { data: existingBlog } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('album_id', albumId)
      .eq('album_type', albumType)
      .single();

    if (existingBlog && !forceRegenerate) {
      console.log('Blog already exists, returning cached version');
      return new Response(
        JSON.stringify({ 
          blog: existingBlog,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If forceRegenerate is true and blog exists, delete it first
    if (existingBlog && forceRegenerate) {
      console.log('Force regenerate requested, deleting existing blog post');
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', existingBlog.id);
      
      if (deleteError) {
        console.error('Error deleting existing blog:', deleteError);
        throw deleteError;
      }
    }

    // Prepare album data for prompt - focus on general album information only
    const albumInfo = `
ALBUM_DATA (gebruik als inspiratie voor algemeen verhaal over dit album):
- artist: ${albumData.artist || '—'}
- album: ${albumData.title || '—'}
- year: ${albumData.year || '—'}
- label: ${albumData.label || '—'}
- catalog: ${albumData.catalog_number || '—'}
- country: ${albumData.country || '—'}
- format: ${albumData.format || '—'}
- matrix: ${albumData.matrix_number || '—'}
- genre: ${albumData.genre || '—'}
- styles: ${albumData.style ? JSON.stringify(albumData.style) : '—'}
- discogs_url: ${albumData.discogs_url || '—'}
- discogs_id: ${albumData.discogs_id || '—'}

INSTRUCTIE: Gebruik deze informatie als BASIS voor een verhaal over het album zelf. 
ZOEK ZELF OP: studio, producer, muzikanten, commercieel succes wereldwijd.
Het verhaal gaat NIET over deze specifieke persing of conditie.
`;

    console.log('Calling OpenAI with album data...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: PLAAT_VERHAAL_PROMPT },
          { role: 'user', content: albumInfo }
        ],
        max_completion_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const blogContent = data.choices[0].message.content;

    console.log('Successfully generated blog content');

    // Search for album cover - try Discogs API first, then Perplexity fallback
    let albumCoverUrl = null;
    
    // Try Discogs API first if we have a discogs_id
    if (albumData.discogs_id && discogsToken) {
      try {
        console.log(`Fetching album cover from Discogs API for ID: ${albumData.discogs_id}`);
        
        const discogsResponse = await fetch(`https://api.discogs.com/releases/${albumData.discogs_id}`, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'PlatenScanner/1.0'
          }
        });
        
        if (discogsResponse.ok) {
          const discogsData = await discogsResponse.json();
          
          // Get the primary image or first image from images array
          if (discogsData.images && discogsData.images.length > 0) {
            // Look for primary image first, otherwise take the first image
            const primaryImage = discogsData.images.find((img: any) => img.type === 'primary') || discogsData.images[0];
            if (primaryImage && primaryImage.uri) {
              albumCoverUrl = primaryImage.uri;
              console.log('Found album cover from Discogs:', albumCoverUrl);
            }
          }
        } else {
          console.log(`Discogs API error: ${discogsResponse.status} - ${discogsResponse.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching from Discogs API:', error);
      }
    }

    // Fallback to Perplexity if Discogs didn't work
    if (!albumCoverUrl && perplexityApiKey) {
      try {
        console.log('Discogs failed, trying Perplexity fallback...');
        
        const coverSearchQuery = `Find direct image URL for album cover: "${albumData.artist}" - "${albumData.title}" ${albumData.year || ''} official album art`;
        console.log(`Trying search query: ${coverSearchQuery}`);
        
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              {
                role: 'system',
                content: 'Find and return ONLY a direct, working image URL for the requested album cover. The URL must be a direct link to an image file (ending in .jpg, .jpeg, .png, .webp). Return only the URL, no other text.'
              },
              {
                role: 'user',
                content: coverSearchQuery
              }
            ],
            temperature: 0.1,
            max_tokens: 150,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const coverContent = perplexityData.choices[0]?.message?.content?.trim();
          
          // Extract image URL
          const urlMatch = coverContent?.match(/(https?:\/\/[^\s\)]+\.(jpg|jpeg|png|webp)(\?[^\s\)]*)?)/i);
          if (urlMatch) {
            albumCoverUrl = urlMatch[0];
            console.log('Found album cover from Perplexity:', albumCoverUrl);
          }
        } else {
          console.log(`Perplexity API error: ${perplexityResponse.status}`);
        }
      } catch (error) {
        console.error('Error with Perplexity fallback:', error);
      }
    }
    
    if (!albumCoverUrl) {
      console.log('No album cover found from any source');
    }

    // Parse the response to extract YAML (ook als het in codefences staat) en de SOCIAL_POST
    let content = blogContent.trimStart();
    let yamlFrontmatter: Record<string, unknown> = {};
    let socialPost = '';

    // 1) Probeer YAML in een codefence aan het begin te vinden
    const fencedYamlMatch = content.match(/^```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/i);
    let yamlCandidate: string | null = null;
    if (fencedYamlMatch && fencedYamlMatch.index === 0) {
      // Als er '---' markers in staan, pak de inhoud daartussen
      const inner = fencedYamlMatch[1];
      const innerFrontmatter = inner.match(/---\s*\n([\s\S]*?)\n---/);
      yamlCandidate = innerFrontmatter ? innerFrontmatter[1] : inner;
      // Verwijder de volledige codefence van het begin
      content = content.slice(fencedYamlMatch[0].length).trimStart();
    }

    // 2) Zo niet, probeer normale YAML frontmatter aan het begin
    if (!yamlCandidate) {
      const plainYamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
      if (plainYamlMatch) {
        yamlCandidate = plainYamlMatch[1];
        content = content.replace(plainYamlMatch[0], '').trimStart();
      }
    }

    // 3) Parse YAML lijnen (eenvoudige parser, verwacht key: value of JSON arrays)
    if (yamlCandidate) {
      try {
        const yamlLines = yamlCandidate.split('\n');
        yamlLines.forEach(line => {
          const m = line.match(/^([^:]+):\s*(.*)$/);
          if (m) {
            const key = m[1].trim();
            const value = m[2].trim();
            if (value.startsWith('[') && value.endsWith(']')) {
              yamlFrontmatter[key] = JSON.parse(value);
            } else if (value === 'true' || value === 'false') {
              yamlFrontmatter[key] = value === 'true';
            } else if (!isNaN(value as unknown as number) && value !== '') {
              yamlFrontmatter[key] = parseFloat(value);
            } else {
              yamlFrontmatter[key] = value.replace(/^["']|["']$/g, '');
            }
          }
        });
      } catch (error) {
        console.error('Error parsing YAML:', error);
      }
    }

    // 4) Haal SOCIAL_POST op en verwijder deze uit de body
    const socialMatch = content.match(/<!--\s*SOCIAL_POST\s*-->\s*([\s\S]*?)$/i);
    if (socialMatch) {
      socialPost = socialMatch[1].trim();
      content = content.replace(/<!--\s*SOCIAL_POST\s*-->[\s\S]*$/i, '').trimEnd();
    }

    // 5) Als de hele body nog in een codefence zit, haal die weg
    content = content.replace(/^```(?:markdown)?\s*\n([\s\S]*?)\n```$/i, '$1');

    // Gebruik de opgeschoonde body als markdown_content
    const markdownBody = content.trim();

    // Generate slug
    const slug = `${albumData.artist?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${albumData.title?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${albumData.year || 'unknown'}`.replace(/--+/g, '-');

    // Save to database
    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        album_id: albumId,
        album_type: albumType,
        user_id: albumData.user_id,
        yaml_frontmatter: yamlFrontmatter,
        markdown_content: markdownBody,
        social_post: socialPost,
        slug: slug,
        album_cover_url: albumCoverUrl,
        is_published: autoPublish,
        published_at: autoPublish ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully saved blog post to database');

    return new Response(
      JSON.stringify({ 
        blog: blogPost,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in plaat-verhaal-generator function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});