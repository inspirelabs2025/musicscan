import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const discogsToken = Deno.env.get('DISCOGS_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Helper function to validate meaningful names
function isMeaningfulName(v?: string): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  const bad = ['unknown', 'unknown artist', 'unknown album', 'onbekend', 'onbekende', 'untitled', '—', '-'];
  return !bad.includes(s);
}

const PLAAT_VERHAAL_PROMPT = `Je bent een muziekjournalist die "Plaat & Verhaal" blogposts schrijft in het Nederlands.

Schrijf een volledige blogpost in **Markdown** met **YAML front matter** + body volgens de exacte structuur hieronder.
Voeg onderaan een korte social post toe.

**KRITIEKE INSTRUCTIE - DISCOGS URL:**
- Als er een discogs_url is meegegeven: BEZOEK DEZE URL EERST
- Haal de correcte artist en album naam van de Discogs pagina
- GEBRUIK DEZE DISCOGS DATA als primaire bron voor artist/album naam
- Negeer de artist/album velden uit ALBUM_DATA als ze niet overeenkomen met Discogs
- De Discogs URL is de WAARHEID, niet de database velden

**BELANGRIJKE INSTRUCTIES:**
- Gebruik de scan informatie ALLEEN als inspiratie voor het album
- Het verhaal gaat over het ALBUM IN HET ALGEMEEN, niet over de specifieke persing uit de scan
- ZOEK ZELF OP en voeg toe: opnamestudio, producer, meewerkende muzikanten, wereldwijd commercieel succes
- Zoek informatie over: albumhoes, historische reviews, collectorswaarde, anekdotes van de artiest
- Feiten moeten kloppen; bij ontbrekende data gebruik "—" of "[ontbreekt]"
- Schrijf helder en deskundig, in het Nederlands
- Maak het verhaal levendig en persoonlijk over het album zelf
- VERMIJD specifieke jaartallen in de tekst - schrijf tijdloos
- Gebruik formulering zoals "vandaag de dag", "nog steeds", "tegenwoordig" in plaats van "in 2024"

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

[Waarom dit album tijdloos relevant is]

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
          .maybeSingle();
        if (error) throw error;
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
          .maybeSingle();
        if (error) throw error;
        albumData = data;
        actualTableUsed = 'ai_scan_results';
      }
    } else if (albumType === 'vinyl') {
      // Try vinyl2_scan first, then ai_scan_results, then releases
      try {
        const { data, error } = await supabase
          .from('vinyl2_scan')
          .select('*')
          .eq('id', albumId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          albumData = data;
          actualTableUsed = 'vinyl2_scan';
        }
      } catch (error) {
        console.log('Not found in vinyl2_scan, trying ai_scan_results...');
      }
      
      if (!albumData) {
        try {
          const { data, error } = await supabase
            .from('ai_scan_results')
            .select('*')
            .eq('id', albumId)
            .maybeSingle();
          if (error) throw error;
          if (data) {
            albumData = data;
            actualTableUsed = 'ai_scan_results';
          }
        } catch (error) {
          console.log('Not found in ai_scan_results, trying releases...');
        }
      }
      
      // If still not found, try releases table (for bulk imported metaalprints)
      if (!albumData) {
        const { data, error } = await supabase
          .from('releases')
          .select('*')
          .eq('id', albumId)
          .maybeSingle();
        if (error) throw error;
        albumData = data;
        actualTableUsed = 'releases';
      }
    } else if (albumType === 'ai') {
      // Direct AI scan results query
      const { data, error } = await supabase
        .from('ai_scan_results')
        .select('*')
        .eq('id', albumId)
        .maybeSingle();
      if (error) throw error;
      albumData = data;
      actualTableUsed = 'ai_scan_results';
    } else if (albumType === 'release') {
      // Direct releases table query for Discogs releases
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', albumId)
        .maybeSingle();
      if (error) throw error;
      albumData = data;
      actualTableUsed = 'releases';
    } else if (albumType === 'product') {
      // Direct platform_products query for ART products
      const { data, error } = await supabase
        .from('platform_products')
        .select('*')
        .eq('id', albumId)
        .maybeSingle();
      if (error) throw error;
      albumData = data;
      actualTableUsed = 'platform_products';
    } else {
      throw new Error("Ongeldig album type: " + albumType);
    }

    if (!albumData) {
      console.log(`Album not found with ID: ${albumId}`);
      return new Response(
        JSON.stringify({ error: 'Album not found', code: 'ALBUM_NOT_FOUND' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found album data in table: ${actualTableUsed}`);

    // Check if blog already exists
    const { data: existingBlog } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('album_id', albumId)
      .eq('album_type', albumType)
      .maybeSingle();

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
    // Handle user_id - for releases table and platform_products, we need to provide a fallback
    let userId = albumData.user_id;
    if (!userId && (actualTableUsed === 'releases' || actualTableUsed === 'platform_products')) {
      // For public releases/products, we need a system user or get from request context
      // For now, we'll use a placeholder - in practice you might want to track who triggered the generation
      userId = '00000000-0000-0000-0000-000000000000'; // System user placeholder
    }

    // Fetch correct data from Discogs API if available
    let discogsArtist = albumData.artist;
    let discogsTitle = albumData.title?.replace(/\s*\[Metaalprint\]\s*$/, '').replace(/^.*?\s*-\s*/, '');
    
    // ✅ FIX: Voor platform_products zonder artist, parse uit title
    if (actualTableUsed === 'platform_products' && !discogsArtist && albumData.title) {
      // Title format: " - Artist - Album [Metaalprint]" or "Artist - Album [Metaalprint]"
      const titleParts = albumData.title.replace(/\s*\[Metaalprint\]\s*$/i, '').split(' - ').filter(p => p.trim());
      if (titleParts.length >= 2) {
        discogsArtist = titleParts[0].trim() || titleParts[1].trim();
        discogsTitle = titleParts.slice(1).join(' - ').trim() || titleParts.slice(2).join(' - ').trim();
        console.log(`✅ Extracted from title: artist="${discogsArtist}", album="${discogsTitle}"`);
      }
    }
    
    if (actualTableUsed === 'platform_products' && albumData.discogs_url && discogsToken) {
      console.log('🎯 Fetching correct data from Discogs RELEASE API...');
      try {
        // ✅ ALWAYS use RELEASE URL for metadata (not master)
        const urlMatch = albumData.discogs_url.match(/\/release\/(\d+)/);
        if (urlMatch) {
          const releaseId = urlMatch[1];
          const discogsApiUrl = `https://api.discogs.com/releases/${releaseId}`;
          console.log('📀 Using RELEASE API:', discogsApiUrl);
          
          const discogsResponse = await fetch(discogsApiUrl, {
            headers: {
              'Authorization': `Discogs token=${discogsToken}`,
              'User-Agent': 'MusicScanApp/1.0'
            }
          });
          
          if (discogsResponse.ok) {
            const discogsData = await discogsResponse.json();
            // Use Discogs data as source of truth
            discogsArtist = discogsData.artists?.[0]?.name || discogsData.artists_sort || discogsArtist;
            discogsTitle = discogsData.title || discogsTitle;
            console.log('✅ Fetched from Discogs:', { artist: discogsArtist, title: discogsTitle });
          } else {
            console.warn('⚠️ Discogs API call failed:', discogsResponse.status);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching Discogs data:', error);
      }
    }

    // Determine effective artist/title based on table and available data
    const effectiveArtist = actualTableUsed === 'platform_products' ? discogsArtist : albumData.artist;
    const effectiveTitle = actualTableUsed === 'platform_products' ? discogsTitle : albumData.title;
    const effectiveYear = albumData.year || albumData.release_year;

    // Guard: Check if we have meaningful names before proceeding
    if (!isMeaningfulName(effectiveArtist) || !isMeaningfulName(effectiveTitle)) {
      console.warn('⚠️ Skipping blog generation: incomplete metadata', { 
        effectiveArtist, 
        effectiveTitle, 
        albumId, 
        albumType, 
        table: actualTableUsed 
      });
      
      return new Response(JSON.stringify({
        error: 'INCOMPLETE_METADATA',
        message: 'Artiest of album is onbekend; bloggeneratie overgeslagen',
        details: { albumId, albumType, artist: effectiveArtist, title: effectiveTitle }
      }), { 
        status: 422, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Validated metadata:', { effectiveArtist, effectiveTitle, effectiveYear });

    // Map platform_products fields to standard album format
    let albumInfo;
    if (actualTableUsed === 'platform_products') {
      albumInfo = `
**CORRECTE ALBUM DATA (van Discogs API opgehaald):**
- artist: ${discogsArtist || '—'}
- album: ${discogsTitle || '—'}
- year: ${albumData.release_year || '—'}
- label: ${albumData.label || '—'}
- catalog: ${albumData.catalog_number || '—'}
- country: ${albumData.country || '—'}
- format: Metal Print
- genre: ${albumData.genre || '—'}
- styles: ${albumData.style ? JSON.stringify(albumData.style) : '—'}
- discogs_url: ${albumData.discogs_url || '—'}
- discogs_id: ${albumData.discogs_id || '—'}

INSTRUCTIE: Gebruik de artist en album naam hierboven voor je blogpost.
Deze data is rechtstreeks van de Discogs API opgehaald en is correct.
ZOEK ZELF OP: studio, producer, muzikanten, commercieel succes wereldwijd.
Het verhaal gaat over het album, niet over deze specifieke persing.
`;
    } else {
      albumInfo = `
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
    }

    // Use Lovable AI Gateway for text generation (OpenAI-compatible)
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: PLAAT_VERHAAL_PROMPT },
          { role: 'user', content: albumInfo }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'AI rate limit bereikt, probeer het later opnieuw.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED', message: 'AI credits op. Voeg tegoed toe om verder te gaan.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const blogContent = data.choices?.[0]?.message?.content;
    if (!blogContent) {
      throw new Error('Lege AI respons: geen content ontvangen');
    }

    console.log('Successfully generated blog content');

    // Search for album cover - try Master ID first (better quality), then Release ID
    let albumCoverUrl = null;
    
    // ✅ Try Master ID first for artwork (higher quality), fallback to Release ID
    const artworkId = albumData.master_id || albumData.discogs_id;
    const artworkType = albumData.master_id ? 'master' : 'release';
    
    if (artworkId && discogsToken) {
      try {
        const endpoint = artworkType === 'master' ? 'masters' : 'releases';
        console.log(`🎨 Fetching album cover from Discogs ${artworkType.toUpperCase()} API for ID: ${artworkId}`);
        
        const discogsResponse = await fetch(`https://api.discogs.com/${endpoint}/${artworkId}`, {
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
              console.log(`✅ Found album cover from Discogs ${artworkType}:`, albumCoverUrl);
            }
          }
        } else {
          console.log(`❌ Discogs API error: ${discogsResponse.status} - ${discogsResponse.statusText}`);
        }
      } catch (error) {
        console.error('❌ Error fetching from Discogs API:', error);
      }
    }

    // Fallback to Perplexity if Discogs didn't work
    if (!albumCoverUrl && perplexityApiKey) {
      try {
        console.log('Discogs failed, trying Perplexity fallback...');
        
        const coverSearchQuery = `Find direct image URL for album cover: "${effectiveArtist}" - "${effectiveTitle}" ${effectiveYear || ''} official album art`;
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

    // Verrijk YAML met betrouwbare Discogs/album-velden (bron: database/Discogs API)
    const ensureMeaningful = (v: any) => (typeof v === 'string' && isMeaningfulName(v) ? v : undefined);
    
    // ✅ Extract only RELEASE ID from URL (not master)
    const extractReleaseIdFromUrl = (u?: string | null) => {
      if (!u) return undefined;
      const m = u.match(/\/release\/(\d+)/i); // Only match /release/ URLs
      return m ? parseInt(m[1], 10) : undefined;
    };

    const enforcedArtist = ensureMeaningful(effectiveArtist);
    const enforcedTitle = ensureMeaningful(effectiveTitle);
    const enforcedYear = albumData.year || albumData.release_year || yamlFrontmatter.year;
    
    // ✅ CRITICAL: Always use RELEASE data, not master
    const enforcedDiscogsUrl = albumData.discogs_url || (typeof yamlFrontmatter.discogs_url === 'string' ? (yamlFrontmatter.discogs_url as string) : undefined);
    const enforcedDiscogsId = albumData.discogs_id || yamlFrontmatter.discogs_id || extractReleaseIdFromUrl(enforcedDiscogsUrl as string);
    const enforcedMasterId = albumData.master_id; // Optional: for artwork only

    yamlFrontmatter = {
      ...yamlFrontmatter,
      ...(enforcedArtist ? { artist: enforcedArtist } : {}),
      ...(enforcedTitle ? { album: enforcedTitle } : {}),
      ...(enforcedYear ? { year: enforcedYear } : {}),
      ...(albumData.label ? { label: albumData.label } : {}),
      ...(albumData.catalog_number ? { catalog: albumData.catalog_number } : {}),
      ...(albumData.country ? { country: albumData.country } : {}),
      ...(albumData.genre ? { genre: albumData.genre } : {}),
      ...(albumData.style ? { styles: Array.isArray(albumData.style) ? albumData.style : [albumData.style] } : {}),
      ...(enforcedDiscogsUrl ? { discogs_url: enforcedDiscogsUrl } : {}), // ✅ Release URL
      ...(enforcedDiscogsId ? { discogs_id: enforcedDiscogsId } : {}), // ✅ Release ID
      ...(enforcedMasterId ? { master_id: enforcedMasterId } : {}), // ✅ Master ID (optional, for artwork)
    } as Record<string, unknown>;

    // Generate slug using effective artist/title (from Discogs for platform_products)
    const slug = `${effectiveArtist?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${effectiveTitle?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${effectiveYear || 'unknown'}`.replace(/--+/g, '-');
    
    console.log('🔗 Generated slug:', slug, { 
      effectiveArtist, 
      effectiveTitle, 
      effectiveYear, 
      release_id: enforcedDiscogsId, 
      release_url: enforcedDiscogsUrl,
      master_id: enforcedMasterId || 'none'
    });

    // Save to database
    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        album_id: albumId,
        album_type: albumType,
        user_id: userId,
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
      
      // Handle duplicate slug error gracefully
      if (insertError.code === '23505' && insertError.message?.includes('blog_posts_slug_key')) {
        console.log('Blog post with this slug already exists, returning as cached');
        // Try to find the existing blog post
        const { data: existingBySlug } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        if (existingBySlug) {
          return new Response(
            JSON.stringify({ 
              blog: existingBySlug,
              cached: true,
              reason: 'duplicate_slug'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
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