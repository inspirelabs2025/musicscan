import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, mediaLibraryId } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Starting artist recognition for image: ${imageUrl.substring(0, 100)}...`);

    const prompt = `You are an expert at identifying musicians and music artists from photos.

Analyze this image and identify any musicians, bands, or music-related people visible.

Consider:
- Facial features and recognition of known artists
- Stage presence and performance context
- Musical instruments being played
- Band merchandise, logos, or branding
- Concert/venue settings
- Album artwork or vinyl covers in frame
- Promotional photos or press shots
- Any text visible that might indicate the artist name

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "primary_artist": "Artist Name or null if unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you identified this artist",
  "alternative_artists": ["Other", "Possible", "Matches"],
  "context_type": "concert|portrait|vinyl|merchandise|album_cover|press_photo|candid|unknown",
  "tags": ["genre", "era", "style"],
  "people_count": 1,
  "contains_text": ["any", "visible", "text"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content.substring(0, 500));

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        primary_artist: null,
        confidence: 0,
        reasoning: 'Could not parse AI response',
        alternative_artists: [],
        context_type: 'unknown',
        tags: [],
        people_count: 0,
        contains_text: []
      };
    }

    // If we have a mediaLibraryId, update the record and potentially auto-add to FanWall
    if (mediaLibraryId) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Update media library record with AI results
      const { error: updateError } = await supabase
        .from('media_library')
        .update({
          ai_status: 'completed',
          recognized_artist: result.primary_artist,
          artist_confidence: result.confidence,
          ai_tags: result.tags || [],
          ai_description: result.reasoning,
          alternative_artists: result.alternative_artists || [],
          ai_context_type: result.context_type,
          ai_reasoning: result.reasoning,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaLibraryId);
      
      if (updateError) {
        console.error('Failed to update media library record:', updateError);
      } else {
        console.log(`Updated media library record ${mediaLibraryId} with artist: ${result.primary_artist}`);
      }

      // AUTO-ADD TO FANWALL if artist recognized with sufficient confidence
      if (result.primary_artist && result.confidence >= 0.5) {
        console.log(`🎸 Auto-adding to FanWall: ${result.primary_artist} (confidence: ${result.confidence})`);
        
        try {
          // 1. Find or create the artist fanwall using existing DB function
          const { data: fanwallId, error: fanwallError } = await supabase
            .rpc('find_or_create_artist_fanwall', { 
              artist_name_input: result.primary_artist 
            });
          
          if (fanwallError) {
            console.error('Failed to find/create fanwall:', fanwallError);
          } else {
            console.log(`FanWall ID: ${fanwallId}`);
            
            // 2. Get the media library item for user_id and photo URL
            const { data: mediaItem, error: mediaError } = await supabase
              .from('media_library')
              .select('user_id, public_url, file_name')
              .eq('id', mediaLibraryId)
              .single();
            
            if (mediaError) {
              console.error('Failed to get media item:', mediaError);
            } else if (mediaItem && mediaItem.user_id) {
              // 3. Check if photo already exists for this media library item
              const { data: existingPhoto } = await supabase
                .from('photos')
                .select('id')
                .eq('original_url', mediaItem.public_url)
                .eq('user_id', mediaItem.user_id)
                .maybeSingle();
              
              if (existingPhoto) {
                console.log('Photo already exists in FanWall, skipping creation');
              } else {
                // 4. Generate unique slug
                const slugBase = result.primary_artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const slug = `${slugBase}-${Date.now()}`;
                
                // 5. Insert photo into photos table
                const { data: newPhoto, error: photoError } = await supabase
                  .from('photos')
                  .insert({
                    user_id: mediaItem.user_id,
                    source_type: 'media_library',
                    original_url: mediaItem.public_url,
                    display_url: mediaItem.public_url,
                    artist: result.primary_artist,
                    caption: result.reasoning || `${result.primary_artist} fan foto`,
                    tags: result.tags || [],
                    status: 'published',
                    seo_slug: slug,
                    seo_title: `${result.primary_artist} Fan Foto`,
                    seo_description: result.reasoning || `Fan foto van ${result.primary_artist}`,
                    published_at: new Date().toISOString(),
                    license_granted: true,
                    print_allowed: true
                  })
                  .select('id')
                  .single();
                
                if (photoError) {
                  console.error('Failed to create photo:', photoError);
                } else {
                  console.log(`✅ Photo ${newPhoto.id} added to ${result.primary_artist} FanWall`);
                  
                  // 6. Mark media library item as sent to fanwall
                  const { error: markError } = await supabase
                    .from('media_library')
                    .update({ 
                      sent_to_fanwall: true,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', mediaLibraryId);
                  
                  if (markError) {
                    console.error('Failed to mark as sent to fanwall:', markError);
                  }
                  
                  // 7. Update fanwall photo count and featured photo
                  // Note: There's a trigger that handles this, but we'll also update explicitly
                  const { error: fanwallUpdateError } = await supabase
                    .from('artist_fanwalls')
                    .update({
                      featured_photo_url: mediaItem.public_url,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', fanwallId);
                  
                  if (fanwallUpdateError) {
                    console.error('Failed to update fanwall:', fanwallUpdateError);
                  } else {
                    console.log(`✅ FanWall updated for ${result.primary_artist}`);
                  }
                }
              }
            }
          }
        } catch (fanwallError) {
          console.error('Error in auto-FanWall process:', fanwallError);
          // Don't fail the whole request if FanWall creation fails
        }
      } else {
        console.log(`Skipping auto-FanWall: artist=${result.primary_artist}, confidence=${result.confidence} (need >= 0.5)`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        mediaLibraryId,
        autoAddedToFanwall: result.primary_artist && result.confidence >= 0.5
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-recognize-artist:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to recognize artist' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
