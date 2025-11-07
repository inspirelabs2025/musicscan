import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// QR Code generation using API
async function generateQRCode(url: string): Promise<string> {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(url)}&bgcolor=000000&color=ffffff&margin=20`;
  return qrApiUrl;
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

    const { eventId, eventData, generateMetal = true } = await req.json();

    if (!eventId && !eventData) {
      throw new Error('Either eventId or eventData is required');
    }

    // Fetch event data if only ID provided
    let event = eventData;
    if (eventId && !eventData) {
      const { data, error } = await supabase
        .from('time_machine_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      event = data;
    }

    // Build style era mapping
    const styleMapping: Record<string, string> = {
      'retro-1980s': '1980s bold geometric fonts, neon colors, grid patterns',
      'punk-1977': '1970s punk aesthetic, torn paper, safety pins, bold block letters',
      'psychedelic-1960s': '1960s psychedelic swirls, vibrant colors, flowing typography',
      'new-wave-1982': '1980s new wave, angular shapes, synth-wave colors',
      'grunge-1990s': '1990s grunge, distressed textures, hand-drawn elements',
      'disco-1970s': '1970s disco, glitter effects, groovy typography',
      'funk-1970s': '1970s funk, bold colors, dynamic compositions'
    };

    const styleDescription = styleMapping[event.poster_style] || 'authentic vintage concert poster aesthetic';
    
    // Extract colors from palette
    const primaryColor = event.color_palette?.primary || '#9333EA';
    const secondaryColor = event.color_palette?.secondary || '#1E40AF';
    const accentColor = event.color_palette?.accent || '#F59E0B';

    // Build AI prompt for standard poster
    const standardPrompt = `Create a ${event.poster_style || 'retro'} concert poster for:

Artist: ${event.artist_name}
Venue: ${event.venue_name}, ${event.venue_city}
Date: ${new Date(event.concert_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
${event.tour_name ? `Tour: ${event.tour_name}` : ''}

Style requirements:
- ${styleDescription}
- Period-accurate typography
- Color palette: primary ${primaryColor}, secondary ${secondaryColor}, accent ${accentColor}
- Include venue architecture elements (${event.venue_name} building characteristics)
- Artist silhouette or iconic pose
- Dramatic stage lighting with spotlights
- Distressed/vintage texture overlay for authenticity
- Leave 150x150px space in bottom-right corner for QR code
- Dimensions: Portrait orientation suitable for 50x70cm print

Technical requirements:
- High resolution (minimum 300 DPI equivalent)
- Print-ready quality
- Balanced composition with clear focal point
- Text should be legible but integrated into the design
- Vintage concert poster aesthetic

Historical context: ${event.historical_context?.substring(0, 200) || 'Legendary live performance'}

The poster should evoke the energy and cultural moment of this historic concert while maintaining authentic period design elements.`;

    console.log('Generating standard poster with Lovable AI...');

    // Call Lovable AI for standard poster
    const standardResponse = await fetch('https://api.lovable.app/v1/images/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        prompt: standardPrompt,
        width: 768,
        height: 1024,
        num_outputs: 1
      }),
    });

    if (!standardResponse.ok) {
      const errorText = await standardResponse.text();
      throw new Error(`Lovable AI error: ${errorText}`);
    }

    const standardResult = await standardResponse.json();
    const standardImageUrl = standardResult.output?.[0];

    if (!standardImageUrl) {
      throw new Error('No image generated from Lovable AI');
    }

    console.log('Standard poster generated, uploading to storage...');

    // Download and upload standard poster to Supabase Storage
    const standardImageResponse = await fetch(standardImageUrl);
    const standardImageBlob = await standardImageResponse.arrayBuffer();
    
    const standardFilename = `${event.slug}-standard-${Date.now()}.png`;
    const { data: standardUpload, error: standardUploadError } = await supabase
      .storage
      .from('time-machine-posters')
      .upload(standardFilename, standardImageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (standardUploadError) throw standardUploadError;

    const { data: standardPublicUrl } = supabase
      .storage
      .from('time-machine-posters')
      .getPublicUrl(standardFilename);

    let metalPrintUrl = null;

    // Generate metal print variant if requested
    if (generateMetal) {
      console.log('Generating metal print variant...');

      const metalPrompt = `${standardPrompt}

METAL PRINT VARIANT ADJUSTMENTS:
- Enhanced contrast for aluminum surface reflection
- Slightly bolder colors to compensate for metal substrate
- Add subtle metallic sheen effect
- Optimized for brushed aluminum printing (40x60cm)
- Shadows should be slightly lifted for metal visibility
- Highlights should pop more for metal reflection
- Overall: Make it "print-ready for metal" - slightly brighter, more vibrant`;

      const metalResponse = await fetch('https://api.lovable.app/v1/images/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          prompt: metalPrompt,
          width: 768,
          height: 1024,
          num_outputs: 1
        }),
      });

      if (metalResponse.ok) {
        const metalResult = await metalResponse.json();
        const metalImageUrl = metalResult.output?.[0];

        if (metalImageUrl) {
          const metalImageResponse = await fetch(metalImageUrl);
          const metalImageBlob = await metalImageResponse.arrayBuffer();
          
          const metalFilename = `${event.slug}-metal-${Date.now()}.png`;
          const { data: metalUpload, error: metalUploadError } = await supabase
            .storage
            .from('time-machine-posters')
            .upload(metalFilename, metalImageBlob, {
              contentType: 'image/png',
              upsert: false
            });

          if (!metalUploadError) {
            const { data: metalPublicUrl } = supabase
              .storage
              .from('time-machine-posters')
              .getPublicUrl(metalFilename);
            metalPrintUrl = metalPublicUrl.publicUrl;
          }
        }
      }
    }

    // Generate QR code URL
    const qrCodeStoryUrl = `https://musicscan.app/time-machine/${event.slug}`;
    const qrCodeImageUrl = await generateQRCode(qrCodeStoryUrl);

    console.log('Posters generated successfully');

    // Update event with poster URLs
    const { error: updateError } = await supabase
      .from('time_machine_events')
      .update({
        poster_image_url: standardPublicUrl.publicUrl,
        metal_print_image_url: metalPrintUrl,
        qr_code_url: qrCodeStoryUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', event.id);

    if (updateError) {
      console.error('Failed to update event with poster URLs:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        poster_url: standardPublicUrl.publicUrl,
        metal_print_url: metalPrintUrl,
        qr_code_url: qrCodeStoryUrl,
        qr_code_image: qrCodeImageUrl,
        event_id: event.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating Time Machine poster:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
