import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Artist style guide for automatic styling
const artistStyleGuide: Record<string, {
  palette: { bg: string; primary: string; accent: string };
  typography: string;
  era: string;
}> = {
  'david bowie': {
    palette: { bg: '#1a0033', primary: '#FFD700', accent: '#9333EA' },
    typography: 'Futura Bold',
    era: 'Glam rock 1970s - bold geometric shapes, metallic accents'
  },
  'nirvana': {
    palette: { bg: '#FFEB3B', primary: '#000000', accent: '#FF0000' },
    typography: 'Franklin Gothic',
    era: 'Grunge 1990s - distressed textures, hand-drawn aesthetic'
  },
  'prince': {
    palette: { bg: '#000000', primary: '#9333EA', accent: '#FFFFFF' },
    typography: 'Futura Condensed',
    era: 'Minneapolis sound - neon purple, sleek modern'
  },
  'the beatles': {
    palette: { bg: '#F5F5DC', primary: '#8B0000', accent: '#000000' },
    typography: 'Cooper Black',
    era: 'British Invasion 1960s - warm colors, classic serif'
  },
  'bob marley': {
    palette: { bg: '#000000', primary: '#FFD700', accent: '#DC143C' },
    typography: 'Impact',
    era: 'Reggae - rasta colors (red, gold, green), bold lettering'
  },
  'amy winehouse': {
    palette: { bg: '#F5F5DC', primary: '#000000', accent: '#8B4513' },
    typography: 'Didot',
    era: 'Neo-soul 2000s - elegant vintage, cursive accents'
  },
  'daft punk': {
    palette: { bg: '#000000', primary: '#C0C0C0', accent: '#FFD700' },
    typography: 'Eurostile Extended',
    era: 'Electronic 2000s - metallic, futuristic, grid patterns'
  },
  'default': {
    palette: { bg: '#FFFFFF', primary: '#000000', accent: '#666666' },
    typography: 'Helvetica Neue',
    era: 'Clean minimalist typography'
  }
};

function getArtistStyle(artistName: string) {
  const normalized = artistName.toLowerCase().trim();
  return artistStyleGuide[normalized] || artistStyleGuide['default'];
}

async function generateQRCode(url: string): Promise<string> {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  return apiUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      artist,
      song,
      lyrics,
      highlightLines,
      album,
      releaseYear,
      stylePreset = 'auto',
      qrLink,
      userLicenseConfirmed,
      licenseType = 'user-responsibility',
      copyrightNotes
    } = await req.json();

    if (!userLicenseConfirmed) {
      return new Response(
        JSON.stringify({ error: 'Copyright bevestiging is verplicht' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get artist style
    const style = stylePreset === 'auto' ? getArtistStyle(artist) : artistStyleGuide[stylePreset] || getArtistStyle(artist);

    // Generate slug
    const slug = `songtekst-${artist.toLowerCase()}-${song.toLowerCase()}`
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);

    // Create lyric poster record
    const { data: posterData, error: insertError } = await supabase
      .from('lyric_posters')
      .insert({
        artist_name: artist,
        song_title: song,
        album_name: album,
        release_year: releaseYear,
        full_lyrics: lyrics,
        highlight_lines: highlightLines,
        style_preset: stylePreset,
        color_palette: style.palette,
        typography_hint: style.typography,
        slug,
        license_type: licenseType,
        copyright_notes: copyrightNotes,
        user_license_confirmed: userLicenseConfirmed
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Created lyric poster record:', posterData.id);

    // Build AI prompt
    const prompt = `Create a minimalist typographic poster in portrait orientation (50x70cm format, 3508x4961px @ 300 DPI):

**Song:** ${artist} - ${song}
${album ? `Album: ${album}` : ''}
${releaseYear ? `Year: ${releaseYear}` : ''}

**Design Layout:**
- Top section: Small subtitle text "${artist} — ${song}" in upper left corner (18pt)
- Center focus area (40% of poster): HIGHLIGHT BLOCK in large bold text (72-96pt):
  """
  ${highlightLines}
  """
- Bottom section (35% of poster): Rest of lyrics in smaller text (14pt, 70% opacity, line-height 1.8):
  ${lyrics.split('\n').filter(line => !highlightLines.includes(line)).join('\n')}
- Bottom-right corner: Reserve 150x150px white space for QR code overlay

**CRITICAL COMPOSITION RULES - PREVENT CROPPING:**
- DO NOT CROP any text elements - all text must be FULLY VISIBLE
- Maintain COMPLETE composition with adequate margins (minimum 40px on all sides)
- Top section: Ensure subtitle text is FULLY visible (not cut off at top)
- Center highlight block: COMPLETELY within frame, not cropped
- Bottom lyrics: FULLY visible, not cut off at bottom
- QR space in bottom-right: Leave 150x150px CLEAR space
- Safe zones: Top 5%, Bottom 8%, Sides 5%

**Style Guide - ${style.era}:**
- Background color: ${style.palette.bg}
- Primary text color: ${style.palette.primary}
- Accent/highlight color: ${style.palette.accent}
- Typography: ${style.typography} or similar

**Design Requirements:**
- Portrait orientation, print-ready quality
- High contrast for readability
- Subtle texture or gradient overlay for premium feel
- Balanced white space around all elements
- The highlight lyrics should be the visual focal point
- Rest of lyrics should be readable but not dominant
- Clean, professional typography layout
- Leave bottom-right corner empty (150x150px) for QR code
- FULL FRAME COMPOSITION - no cropped elements
- All text fully readable and within safe margins

The poster should capture the essence and era of ${artist} while maintaining excellent typography and visual hierarchy.`;

    console.log('Calling Lovable AI for poster generation...');

    // Generate poster with Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: prompt
        }],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('No image generated by AI');
    }

    console.log('AI poster generated successfully');

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `lyric-posters/${posterData.id}/standard-poster.png`;
    const { error: uploadError } = await supabase.storage
      .from('time-machine-posters')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('time-machine-posters')
      .getPublicUrl(fileName);

    const posterUrl = urlData.publicUrl;
    console.log('Poster uploaded to:', posterUrl);

    // Generate QR code if link provided
    let qrCodeUrl = null;
    if (qrLink) {
      qrCodeUrl = await generateQRCode(qrLink);
      console.log('QR code generated:', qrCodeUrl);
    }

    // Call batch style generator
    console.log('Generating style variants...');
    const { data: styleData, error: styleError } = await supabase.functions.invoke(
      'batch-generate-poster-styles',
      {
        body: {
          posterUrl,
          eventId: posterData.id,
          artistName: artist
        }
      }
    );

    const styleVariants = styleError ? [] : styleData.styleVariants || [];
    console.log(`Generated ${styleVariants.length} style variants`);

    // Update poster record with generated assets
    const { error: updateError } = await supabase
      .from('lyric_posters')
      .update({
        poster_url: posterUrl,
        style_variants: styleVariants,
        qr_code_url: qrCodeUrl
      })
      .eq('id', posterData.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        poster_id: posterData.id,
        poster_url: posterUrl,
        qr_code_url: qrCodeUrl,
        style_variants: styleVariants,
        slug
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-lyric-poster:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
