import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtistPhotoResult {
  postId: string;
  title: string;
  artistName: string;
  photoUrl?: string;
  photoSource: 'perplexity_url' | 'openai_generated';
  success: boolean;
  error?: string;
}

// Extract artist name from news title using Perplexity
async function extractArtistName(title: string, perplexityApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Extract the main artist or band name from the music news title. Return ONLY the artist/band name, nothing else. If multiple artists, return the primary one.'
          },
          {
            role: 'user',
            content: `Extract artist name from: "${title}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity extract error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const artistName = data.choices[0].message.content.trim().replace(/['"]/g, '');
    console.log(`Extracted artist: ${artistName} from "${title}"`);
    return artistName;

  } catch (error) {
    console.error('Error extracting artist name:', error);
    return null;
  }
}

// Search for official artist photo URL using Perplexity
async function searchArtistPhotoUrl(artistName: string, perplexityApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Find official press photos or professional photos of musicians/bands. Return ONLY a direct HTTP/HTTPS image URL (.jpg, .jpeg, .png, .webp), nothing else. No explanations, just the URL.'
          },
          {
            role: 'user',
            content: `Find official press photo URL for artist: "${artistName}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity photo search error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Extract URL from response - look for http/https URLs
    const urlMatch = content.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|webp))/i);
    if (urlMatch) {
      const photoUrl = urlMatch[1];
      console.log(`Found photo URL for ${artistName}: ${photoUrl}`);
      return photoUrl;
    }

    console.log(`No valid photo URL found for ${artistName}`);
    return null;

  } catch (error) {
    console.error('Error searching artist photo:', error);
    return null;
  }
}

// Generate realistic artist portrait using OpenAI
async function generateArtistPortrait(artistName: string, slug: string, supabase: any): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.log('OpenAI API key not configured');
      return null;
    }

    const imagePrompt = `Professional portrait of ${artistName}, realistic style, high quality music artist photo, studio lighting, professional photography, no text or logos, detailed and realistic`;

    console.log(`Generating portrait for: ${artistName}`);
    
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        output_format: 'png'
      }),
    });

    if (!imageResponse.ok) {
      console.error(`OpenAI Image API error: ${imageResponse.status}`);
      return null;
    }

    const imageData = await imageResponse.json();
    const imageBase64 = imageData.data[0].b64_json;
    
    if (!imageBase64) {
      console.error('No image data received from OpenAI');
      return null;
    }

    // Convert base64 to blob for upload
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const filename = `artist-${slug}-${Date.now()}.png`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading generated image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(filename);

    console.log(`Generated portrait uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error generating artist portrait:', error);
    return null;
  }
}

// Download and upload external image URL to Supabase storage
async function downloadAndUploadImage(imageUrl: string, slug: string, supabase: any): Promise<string | null> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const imageBuffer = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `artist-${slug}-${Date.now()}.${extension}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filename, imageBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading downloaded image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(filename);

    console.log(`Downloaded image uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error downloading and uploading image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!perplexityApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Perplexity API key not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting artist photo backfill process...');

    // Get all news posts without images
    const { data: postsWithoutImages, error: fetchError } = await supabase
      .from('news_blog_posts')
      .select('id, title, slug')
      .is('image_url', null)
      .order('created_at', { ascending: false })
      .limit(20); // Process max 20 posts at a time

    if (fetchError) {
      console.error('Error fetching posts:', fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch posts'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!postsWithoutImages || postsWithoutImages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No posts found without images',
        processed: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${postsWithoutImages.length} posts without images`);
    
    const results: ArtistPhotoResult[] = [];

    // Process each post
    for (const post of postsWithoutImages) {
      console.log(`\n--- Processing: ${post.title} ---`);
      
      const result: ArtistPhotoResult = {
        postId: post.id,
        title: post.title,
        artistName: '',
        photoSource: 'openai_generated',
        success: false
      };

      try {
        // Step 1: Extract artist name
        const artistName = await extractArtistName(post.title, perplexityApiKey);
        if (!artistName) {
          result.error = 'Failed to extract artist name';
          results.push(result);
          continue;
        }
        result.artistName = artistName;

        // Step 2: Search for official photo URL
        const photoUrl = await searchArtistPhotoUrl(artistName, perplexityApiKey);
        let finalImageUrl: string | null = null;

        if (photoUrl) {
          // Try to download and upload the found image
          finalImageUrl = await downloadAndUploadImage(photoUrl, post.slug, supabase);
          if (finalImageUrl) {
            result.photoSource = 'perplexity_url';
          }
        }

        // Step 3: Fallback to OpenAI generation if no URL or download failed
        if (!finalImageUrl) {
          console.log(`No usable photo found, generating for: ${artistName}`);
          finalImageUrl = await generateArtistPortrait(artistName, post.slug, supabase);
        }

        if (finalImageUrl) {
          // Update the database with the image URL
          const { error: updateError } = await supabase
            .from('news_blog_posts')
            .update({ image_url: finalImageUrl })
            .eq('id', post.id);

          if (updateError) {
            console.error('Error updating post with image:', updateError);
            result.error = 'Failed to update database';
          } else {
            result.photoUrl = finalImageUrl;
            result.success = true;
            console.log(`✅ Successfully updated ${post.title} with ${result.photoSource}`);
          }
        } else {
          result.error = 'Failed to generate or download image';
        }

      } catch (error) {
        console.error(`Error processing post ${post.title}:`, error);
        result.error = error.message;
      }

      results.push(result);
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n=== Backfill Complete ===`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.length} posts: ${successful} successful, ${failed} failed`,
      results: results,
      summary: {
        total: results.length,
        successful,
        failed,
        perplexity_urls: results.filter(r => r.photoSource === 'perplexity_url').length,
        openai_generated: results.filter(r => r.photoSource === 'openai_generated').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in artist photo backfill:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});