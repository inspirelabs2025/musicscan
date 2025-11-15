import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, fullText } = await req.json();

    if (!artistName || !fullText) {
      return new Response(
        JSON.stringify({ error: 'Artist name and full text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum text length
    const wordCount = fullText.trim().split(/\s+/).length;
    if (wordCount < 100) {
      return new Response(
        JSON.stringify({ error: 'Text must be at least 100 words' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for duplicate
    const { data: existingSpotlight } = await supabase
      .from('artist_stories')
      .select('id')
      .eq('artist_name', artistName)
      .eq('is_spotlight', true)
      .maybeSingle();

    if (existingSpotlight) {
      return new Response(
        JSON.stringify({ 
          error: 'Spotlight already exists for this artist',
          code: 'DUPLICATE',
          existing_id: existingSpotlight.id 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Formatting text for ${artistName} (${wordCount} words)...`);

    // Generate slug first (needed for image uploads)
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    const slug = generateSlug(artistName);

    // Generate AI portrait for the artist
    console.log(`Generating AI portrait for ${artistName}...`);
    let artistPortraitUrl = null;
    
    try {
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{
            role: 'user',
            content: `Generate a professional artistic portrait of ${artistName}, the musician. Style: artistic, professional, music-themed.`
          }],
          modalities: ['image', 'text']
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (base64Image) {
          // Upload to Supabase Storage
          const fileName = `${slug}-portrait-${Date.now()}.png`;
          const imageBuffer = Uint8Array.from(atob(base64Image.split(',')[1]), c => c.charCodeAt(0));
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artist-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              cacheControl: '3600'
            });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('artist-images')
              .getPublicUrl(fileName);
            artistPortraitUrl = publicUrl;
            console.log(`✅ Portrait generated and uploaded: ${publicUrl}`);
          }
        }
      }
    } catch (error) {
      console.error('Error generating portrait:', error);
      // Continue without portrait if generation fails
    }

    // Try to fetch album artwork from Discogs
    console.log(`Fetching album artwork from Discogs for ${artistName}...`);
    const albumArtworks: any[] = [];
    const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
    
    if (DISCOGS_TOKEN) {
      try {
        const discogsUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=master&per_page=5`;
        const discogsResponse = await fetch(discogsUrl, {
          headers: { 'Authorization': `Discogs token=${DISCOGS_TOKEN}` }
        });

        if (discogsResponse.ok) {
          const discogsData = await discogsResponse.json();
          for (const result of discogsData.results?.slice(0, 5) || []) {
            if (result.cover_image && result.cover_image !== '') {
              albumArtworks.push({
                url: result.cover_image,
                title: result.title,
                year: result.year,
                type: 'album_cover'
              });
            }
          }
          console.log(`✅ Found ${albumArtworks.length} album covers from Discogs`);
        }
      } catch (error) {
        console.error('Error fetching from Discogs:', error);
      }
    }

    // Build spotlight images array
    const spotlightImages = [];
    if (artistPortraitUrl) {
      spotlightImages.push({
        url: artistPortraitUrl,
        type: 'portrait',
        description: `AI-generated portrait of ${artistName}`
      });
    }
    spotlightImages.push(...albumArtworks);

    // PHASE 1: Format text and identify image moments
    console.log('📝 Phase 1: Formatting text and identifying image moments...');
    const phase1Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Je bent een markdown formatter en content analyzer. Je moet:
1. De tekst opmaken als nette markdown (## en ### headers, **bold**, etc.)
2. 3-5 sleutelmomenten identificeren waar een afbeelding het verhaal versterkt

RETURN VALID JSON met deze exacte structuur:
{
  "formatted_content": "markdown text with {{IMAGE_1}}, {{IMAGE_2}} placeholders at natural break points",
  "image_suggestions": [
    {
      "placeholder": "IMAGE_1",
      "section_title": "Korte titel van de sectie",
      "prompt": "Zeer specifieke beschrijving voor afbeelding generatie. Beschrijf compositie, stijl, onderwerp in detail.",
      "position_description": "Waar in de tekst (bijv. 'na introductie', 'bij doorbraak moment')"
    }
  ]
}

AFBEELDING RICHTLIJNEN:
- Spreidt 3-5 afbeeldingen gelijkmatig door de tekst
- Diverse types: portretten, instrumenten, concert scenes, historische context
- Plaats {{PLACEHOLDER}} op natuurlijke onderbrekingsmomenten
- Specifieke prompts: stijl (fotorealistisch/artistiek), compositie, tijdperk, sfeer

MARKDOWN REGELS:
- Wijzig GEEN inhoudelijke tekst
- Alleen formatting toevoegen
- Headers voor nieuwe secties
- Bold voor nadruk`
          },
          {
            role: 'user',
            content: `Artiest: ${artistName}\n\nFormat deze tekst als markdown en identificeer 3-5 afbeeldingsmomenten:\n\n${fullText}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!phase1Response.ok) {
      const errorText = await phase1Response.text();
      console.error('Phase 1 AI API error:', phase1Response.status, errorText);
      
      if (phase1Response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (phase1Response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Phase 1 AI API error: ${phase1Response.status}`);
    }

    const phase1Data = await phase1Response.json();
    const aiMessage = phase1Data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let formattedContent = '';
    let imageSuggestions: any[] = [];
    
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiMessage.match(/```json\n?(.*?)\n?```/s) || aiMessage.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiMessage;
      const parsedResponse = JSON.parse(jsonStr);
      
      formattedContent = parsedResponse.formatted_content || aiMessage;
      imageSuggestions = parsedResponse.image_suggestions || [];
      
      console.log(`✅ Phase 1 complete: ${imageSuggestions.length} image moments identified`);
    } catch (parseError) {
      console.error('Failed to parse JSON response, using raw content:', parseError);
      formattedContent = aiMessage;
      imageSuggestions = [];
    }

    // PHASE 2: Generate contextual images
    console.log(`🎨 Phase 2: Generating ${imageSuggestions.length} contextual images...`);
    
    for (let i = 0; i < imageSuggestions.length; i++) {
      const suggestion = imageSuggestions[i];
      
      try {
        console.log(`  Generating image ${i + 1}/${imageSuggestions.length}: ${suggestion.section_title}`);
        
        const imageGenResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: `${suggestion.prompt}. Context: ${artistName} spotlight story. Style: professional, music-themed, artistic.`
            }],
            modalities: ['image', 'text']
          })
        });

        if (imageGenResponse.ok) {
          const imageData = await imageGenResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (base64Image) {
            const fileName = `${slug}-image-${i + 1}-${Date.now()}.png`;
            const imageBuffer = Uint8Array.from(atob(base64Image.split(',')[1]), c => c.charCodeAt(0));
            
            const { error: uploadError } = await supabase.storage
              .from('artist-images')
              .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                cacheControl: '3600'
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('artist-images')
                .getPublicUrl(fileName);
              
              // Replace placeholder with actual image markdown
              const imageMarkdown = `\n\n![${suggestion.section_title}](${publicUrl})\n*${suggestion.section_title}*\n\n`;
              formattedContent = formattedContent.replace(
                `{{${suggestion.placeholder}}}`,
                imageMarkdown
              );
              
              console.log(`  ✅ Image ${i + 1} generated and inserted`);
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed to generate image ${i + 1}:`, error);
        // Remove placeholder if image generation fails
        formattedContent = formattedContent.replace(`{{${suggestion.placeholder}}}`, '');
      }
    }

    // Calculate reading time (avg 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Insert into database with images
    const { data: newSpotlight, error: insertError } = await supabase
      .from('artist_stories')
      .insert({
        artist_name: artistName,
        story_content: formattedContent,
        slug,
        is_spotlight: true,
        is_published: false,
        word_count: wordCount,
        reading_time: readingTime,
        user_id: userId,
        artwork_url: artistPortraitUrl,
        spotlight_images: spotlightImages.length > 0 ? spotlightImages : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`✅ Spotlight formatted and saved for ${artistName}`);

    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: newSpotlight.id,
          story_content: newSpotlight.story_content,
          word_count: newSpotlight.word_count,
          reading_time: newSpotlight.reading_time,
          slug: newSpotlight.slug,
          artwork_url: newSpotlight.artwork_url,
          spotlight_images: newSpotlight.spotlight_images,
        images_generated: spotlightImages.length,
        contextual_images: imageSuggestions.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in format-spotlight-text:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
