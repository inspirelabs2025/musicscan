import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLAAT_VERHAAL_PROMPT = `Je bent een muziekjournalist die "Plaat & Verhaal" blogposts schrijft in het Nederlands.

Schrijf een volledige blogpost in **Markdown** met **YAML front matter** + body volgens de exacte structuur hieronder.
Voeg onderaan een korte social post en een product card JSON toe.

**Regels:**
- Feiten moeten kloppen; bij ontbrekende data gebruik "—" of "[ontbreekt]"
- Vermeld altijd: studio, producer, muzikanten, covers (indien bekend)
- Schrijf helder en deskundig, in het Nederlands
- Eindig altijd met een CTA om het album te kopen/reserveren
- Gebruik concrete details uit de albumdata
- Maak het verhaal levendig en persoonlijk

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
pressing: "Persing info"
matrix: "Matrix nummer"
studio: "Opnamestudio"
producer: "Producer"
musicians: "Muzikanten"
covers: "Cover info"
genre: "Genre"
styles: ["Style1", "Style2"]
condition_media: "NM"
condition_sleeve: "VG+"
price_eur: 25.00
quantity: 1
sku: "SKU123"
images: ["image1.jpg"]
audio_links: ["spotify_link"]
store: "VinylVault"
slug: "artist-album-year"
tags: ["tag1", "tag2", "tag3"]
meta_title: "SEO titel (max 60 chars)"
meta_description: "SEO beschrijving (max 160 chars)"
og_image: "og-image.jpg"
reading_time: 4
word_count: 800
---
\`\`\`

**Body structuur (gebruik deze exacte kopjes in deze volgorde):**

## Waarom deze plaat nú?

[Actuele hook waarom dit album nu relevant is]

## Het verhaal

[Het verhaal achter het album - studio, producer, muzikanten, covers meenemen als beschikbaar]

## Luistertips

[Concrete tracks om naar te luisteren]

## Persing & staat

[Details over deze specifieke persing en staat]

## Voor wie is dit?

[Doelgroep en waarom zij dit album zouden willen]

## Prijs & meenemen

[Prijs uitleg en call-to-action]

**Extra blokken onderaan:**

<!-- SOCIAL_POST -->
[Korte alinea van max 280 tekens + relevante hashtags]

<!-- PRODUCT_CARD -->
\`\`\`json
{
  "title": "Artiest - Album (Year)",
  "price_eur": 25.00,
  "condition": "NM/VG+",
  "slug": "artist-album-year",
  "image": "image.jpg",
  "tags": ["genre", "year", "label"]
}
\`\`\`

Gebruik alleen de verstrekte albumdata. Geen fantasie of aannames.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { albumId, albumType } = await req.json();

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

    if (existingBlog) {
      console.log('Blog already exists, returning cached version');
      return new Response(
        JSON.stringify({ 
          blog: existingBlog,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare album data for prompt
    const albumInfo = `
ALBUM_DATA:
- artist: ${albumData.artist || '—'}
- album: ${albumData.title || '—'}
- year: ${albumData.year || '—'}
- label: ${albumData.label || '—'}
- catalog: ${albumData.catalog_number || '—'}
- country: ${albumData.country || '—'}
- pressing: ${albumData.format || '—'}
- matrix: ${albumData.matrix_number || '—'}
- genre: ${albumData.genre || '—'}
- styles: ${albumData.style ? JSON.stringify(albumData.style) : '—'}
- condition_media: ${albumData.condition_grade || 'VG+'}
- condition_sleeve: ${albumData.marketplace_sleeve_condition || 'VG+'}
- price_eur: ${albumData.marketplace_price || albumData.calculated_advice_price || '—'}
- discogs_url: ${albumData.discogs_url || '—'}
- discogs_id: ${albumData.discogs_id || '—'}
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

    // Parse the response to extract different parts
    const yamlMatch = blogContent.match(/---\n([\s\S]*?)\n---/);
    const socialMatch = blogContent.match(/<!-- SOCIAL_POST -->\n([\s\S]*?)(?=\n<!-- |$)/);
    const productMatch = blogContent.match(/<!-- PRODUCT_CARD -->\n```json\n([\s\S]*?)\n```/);
    
    let yamlFrontmatter = {};
    let socialPost = '';
    let productCard = {};

    if (yamlMatch) {
      try {
        // Simple YAML parsing for this specific structure
        const yamlString = yamlMatch[1];
        const yamlLines = yamlString.split('\n');
        yamlLines.forEach(line => {
          const match = line.match(/^([^:]+):\s*(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (value.startsWith('[') && value.endsWith(']')) {
              yamlFrontmatter[key] = JSON.parse(value);
            } else if (value === 'true' || value === 'false') {
              yamlFrontmatter[key] = value === 'true';
            } else if (!isNaN(value) && value !== '') {
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

    if (socialMatch) {
      socialPost = socialMatch[1].trim();
    }

    if (productMatch) {
      try {
        productCard = JSON.parse(productMatch[1]);
      } catch (error) {
        console.error('Error parsing product card JSON:', error);
      }
    }

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
        markdown_content: blogContent,
        social_post: socialPost,
        product_card: productCard,
        slug: slug,
        is_published: false
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