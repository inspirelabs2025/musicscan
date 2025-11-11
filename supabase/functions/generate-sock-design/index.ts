import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALBUM_DESIGN_ELEMENTS: Record<string, string> = {
  'pink floyd dark side of the moon': 'Rainbow prism gradient on black with triangular geometric elements',
  'nirvana nevermind': 'Yellow gradient with underwater blue tones and minimal iconic motif',
  'the beatles sgt pepper': 'Vibrant psychedelic rainbow stripes with ornate Victorian patterns',
  'joy division unknown pleasures': 'White radiating waveform pattern on black background',
  'the velvet underground and nico': 'Yellow with pop art banana illustration on white stripes',
  'david bowie ziggy stardust': 'Metallic silver and electric blue with lightning bolt accent',
  'radiohead ok computer': 'Glitch art patterns in white/cyan/red on black digital noise',
  'fleetwood mac rumours': 'Mystical black with silver chain pattern and bohemian details',
};

function getAlbumElements(album: string, artist: string): string {
  const key = `${artist.toLowerCase()} ${album.toLowerCase()}`;
  return ALBUM_DESIGN_ELEMENTS[key] || `Abstract patterns inspired by ${album}'s visual aesthetic`;
}

function generateSlug(artist: string, album: string): string {
  const base = `${artist}-${album}-socks`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.substring(0, 80);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      artistName, 
      albumTitle, 
      albumCoverUrl,
      colorPalette,
      discogsId,
      releaseYear,
      genre,
      userId
    } = await req.json();

    if (!artistName || !albumTitle || !colorPalette) {
      return new Response(
        JSON.stringify({ error: 'artistName, albumTitle, and colorPalette are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧦 Generating sock design for:', artistName, '-', albumTitle);
    const startTime = Date.now();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Create premium black crew socks with a creative, all-over design inspired by this album artwork. The design should be INTEGRATED into the sock fabric, not just placed on top.

**CRITICAL DESIGN REQUIREMENTS:**
- Base: Premium BLACK crew socks (not white, not neutral - BLACK)
- Design Integration: The album artwork elements should flow creatively THROUGHOUT the entire sock
- Coverage: Design elements from toe to cuff, wrapping around the entire circumference
- Style: Deconstructed, abstract interpretation that remains RECOGNIZABLE to the original album
- The artwork's key visual elements, colors, and iconic details must be identifiable
- Think: all-over print fashion, not just a logo placement

**COMPOSITION:**
- Show 2 black socks side by side, standing upright on invisible mannequin/legs
- 3D perspective showing form, natural fabric draping, and subtle wrinkles
- Design should follow the sock's contours naturally (wrapping around curves)
- Toe, heel, ankle, calf areas all feature integrated design elements
- Professional product photography with studio lighting creating depth and shadows

**DESIGN STYLE:**
- Photorealistic merchandise photography (NOT flat mockup)
- The album's visual DNA is woven into the fabric pattern
- Creative reinterpretation: break down iconic elements and flow them across the sock
- Maintain recognizability: someone should say "oh, that's [album name]!"
- Premium, wearable streetwear aesthetic
- Clean white background
- Ultra high resolution

**EXAMPLE APPROACH:**
If the album cover has geometric shapes → distribute those shapes across the sock
If it has a color palette → use those colors in an all-over pattern
If it has iconic imagery → abstract and repeat those elements creatively
The result should feel like custom designer socks, not just "album cover printed on sock"`;

    console.log('🎨 Calling AI for sock design with album artwork...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: albumCoverUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated by AI');
    }

    console.log('✅ Sock design generated, uploading to storage...');

    // Upload to Supabase Storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const slug = generateSlug(artistName, albumTitle);
    const filename = `${slug}-${Date.now()}.png`;

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

    // Create album_socks record
    const { data: sockData, error: sockError } = await supabase
      .from('album_socks')
      .insert({
        user_id: userId,
        artist_name: artistName,
        album_title: albumTitle,
        album_cover_url: albumCoverUrl,
        discogs_id: discogsId,
        release_year: releaseYear,
        genre: genre,
        primary_color: colorPalette.primary_color,
        secondary_color: colorPalette.secondary_color,
        accent_color: colorPalette.accent_color,
        color_palette: colorPalette.color_palette,
        design_theme: colorPalette.design_theme,
        pattern_type: colorPalette.pattern_type,
        base_design_url: publicUrl,
        slug: slug,
        generation_time_ms: Date.now() - startTime,
        description: `Stylish socks featuring the iconic album artwork of "${albumTitle}" by ${artistName}. The original album cover is prominently displayed on these premium crew socks.`,
        story_text: `These unique socks showcase the complete album artwork from ${artistName}'s ${releaseYear || 'classic'} album "${albumTitle}". Wear a piece of music history with the full album cover design on these comfortable crew socks.`
      })
      .select()
      .single();

    if (sockError) {
      console.error('Database error:', sockError);
      throw new Error(`Failed to save sock: ${sockError.message}`);
    }

    const generationTime = Date.now() - startTime;
    console.log(`🎉 Sock design complete in ${generationTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        sock_id: sockData.id,
        slug: sockData.slug,
        base_design_url: publicUrl,
        color_palette: colorPalette,
        generation_time_ms: generationTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error generating sock design:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
