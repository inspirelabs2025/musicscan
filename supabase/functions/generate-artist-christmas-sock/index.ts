import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSlug(artist: string, song: string): string {
  const base = `${artist}-${song}-christmas-socks`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.substring(0, 80);
}

async function fetchDiscogsArtistImage(artistName: string): Promise<string | null> {
  const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
  if (!DISCOGS_TOKEN) {
    console.log('⚠️ DISCOGS_TOKEN not configured');
    return null;
  }

  try {
    // Search for artist
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=1`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'MusicScan/1.0'
      }
    });

    if (!searchResponse.ok) {
      console.log('Discogs search failed:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const artistId = searchData.results?.[0]?.id;

    if (!artistId) {
      console.log('No artist found on Discogs for:', artistName);
      return null;
    }

    // Get artist details with images
    const artistUrl = `https://api.discogs.com/artists/${artistId}`;
    const artistResponse = await fetch(artistUrl, {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'MusicScan/1.0'
      }
    });

    if (!artistResponse.ok) {
      console.log('Discogs artist fetch failed:', artistResponse.status);
      return null;
    }

    const artistData = await artistResponse.json();
    const imageUrl = artistData.images?.[0]?.uri;

    console.log('📸 Found Discogs artist image:', imageUrl?.substring(0, 60) + '...');
    return imageUrl || null;

  } catch (error) {
    console.error('Discogs API error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { artistName, songTitle, artistImageUrl: providedImageUrl } = await req.json();

    if (!artistName || !songTitle) {
      return new Response(
        JSON.stringify({ error: 'artistName and songTitle are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧦🎄 Generating realistic artist Christmas sock for:', artistName, '-', songTitle);
    const startTime = Date.now();

    // Step 1: Get real artist photo from Discogs
    let artistImageUrl = providedImageUrl;
    if (!artistImageUrl) {
      console.log('🔍 Fetching artist photo from Discogs...');
      artistImageUrl = await fetchDiscogsArtistImage(artistName);
    }

    if (!artistImageUrl) {
      console.log('❌ No artist image found, cannot generate realistic sock');
      return new Response(
        JSON.stringify({ 
          error: `No artist photo found for ${artistName}. Realistic socks require an actual photo.`,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📸 Using artist photo:', artistImageUrl.substring(0, 60) + '...');

    // Step 2: Apply posterize effect to the real photo via stylize-photo
    console.log('🎨 Applying posterize effect to artist photo...');
    
    const { data: stylizeData, error: stylizeError } = await supabase.functions.invoke('stylize-photo', {
      body: { 
        imageUrl: artistImageUrl, 
        style: 'posterize',
        preserveComposition: true 
      }
    });

    if (stylizeError || !stylizeData?.success || !stylizeData?.stylizedImageUrl) {
      console.error('Stylize error:', stylizeError || stylizeData?.error);
      throw new Error(`Failed to stylize photo: ${stylizeError?.message || stylizeData?.error || 'Unknown error'}`);
    }

    const stylizedPhotoBase64 = stylizeData.stylizedImageUrl;
    console.log('✅ Photo stylized with posterize effect');

    // Step 3: Generate sock mockup with the stylized photo (NO artist name)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const sockMockupPrompt = `Create a photorealistic premium BLACK crew sock product mockup.

**SOCK DESIGN - CRITICAL:**
- Show 2 premium BLACK crew socks side by side at a natural angle
- RED and GREEN striped band at the cuff (top of sock) - Christmas colors
- The provided pop art image should fill a LARGE panel on the sock leg area
- Image panel should cover most of the sock from below the cuff to above the heel
- The pop art image must be LARGE, visible and prominent - NOT a small thumbnail
- Make the artwork wrap naturally around the sock shape
- Realistic ribbed sock texture with natural fabric creases

**PRODUCT PHOTOGRAPHY:**
- Professional studio lighting, clean white/light gray background
- Natural 3D perspective showing sock depth and form
- Subtle shadows for realism
- Ultra high resolution product photo quality

**IMPORTANT:**
- NO text, NO artist names, NO labels anywhere on the socks
- Only the pop art styled image as the design
- Make it look like a real e-commerce product photo
- The artwork should be the hero - large and prominent on the sock`;

    console.log('🧦 Generating sock mockup with stylized photo...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: sockMockupPrompt },
            { type: 'image_url', image_url: { url: stylizedPhotoBase64 } }
          ]
        }],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const mockupImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!mockupImageUrl) {
      throw new Error('No sock mockup image generated by AI');
    }

    console.log('✅ Sock mockup generated, uploading to storage...');

    // Upload to Supabase Storage
    const base64Data = mockupImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const timestamp = Date.now();
    const baseSlug = generateSlug(artistName, songTitle);
    const slug = `${baseSlug}-${timestamp}`;
    const filename = `christmas/${slug}.png`;

    const { error: uploadError } = await supabase.storage
      .from('time-machine-posters')
      .upload(`socks/${filename}`, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('time-machine-posters')
      .getPublicUrl(`socks/${filename}`);

    console.log('📦 Creating album_socks record...');

    // Christmas color palette
    const christmasPalette = {
      primary_color: '#C41E3A',
      secondary_color: '#228B22',
      accent_color: '#FFD700',
    };

    // Create album_socks record
    const { data: sockData, error: sockError } = await supabase
      .from('album_socks')
      .insert({
        artist_name: artistName,
        album_title: songTitle,
        album_cover_url: artistImageUrl,
        primary_color: christmasPalette.primary_color,
        secondary_color: christmasPalette.secondary_color,
        accent_color: christmasPalette.accent_color,
        color_palette: ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF'],
        design_theme: 'posterize',
        pattern_type: 'christmas',
        base_design_url: publicUrl,
        slug: slug,
        genre: 'Christmas',
        generation_time_ms: Date.now() - startTime,
        description: `Feestelijke kerstsokken met ${artistName} in pop art stijl. Geïnspireerd door de klassieker "${songTitle}".`,
        story_text: `Unieke kerstsokken met een echte ${artistName} foto in pop art posterize stijl. Perfect voor de kerst muziekliefhebber.`
      })
      .select()
      .single();

    if (sockError) {
      console.error('Database error:', sockError);
      throw new Error(`Failed to save sock: ${sockError.message}`);
    }

    const generationTime = Date.now() - startTime;
    console.log(`🎉 Realistic artist Christmas sock complete in ${generationTime}ms`);
    console.log(`   Sock ID: ${sockData.id}`);
    console.log(`   Design URL: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        sock_id: sockData.id,
        slug: sockData.slug,
        base_design_url: publicUrl,
        artist: artistName,
        song: songTitle,
        original_photo: artistImageUrl,
        generation_time_ms: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error generating artist Christmas sock:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
