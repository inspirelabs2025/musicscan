import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { discogs_url, artist, title, media_type, item_id, item_type } = await req.json();

    console.log('🎨 Starting artwork fetch for:', { artist, title, media_type, discogs_url });

    let artworkUrl = null;

    // Try to fetch artwork from Discogs
    if (discogs_url) {
      try {
        console.log('🔍 Fetching from Discogs:', discogs_url);
        
        // Extract discogs ID from URL
        const discogsIdMatch = discogs_url.match(/\/release\/(\d+)/);
        if (discogsIdMatch) {
          const discogsId = discogsIdMatch[1];
          const discogsApiUrl = `https://api.discogs.com/releases/${discogsId}`;
          
          const response = await fetch(discogsApiUrl, {
            headers: {
              'User-Agent': 'VinylScanner/1.0',
              'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Look for primary image
            if (data.images && data.images.length > 0) {
              const primaryImage = data.images.find((img: any) => img.type === 'primary') || data.images[0];
              artworkUrl = primaryImage.resource_url;
              console.log('✅ Found Discogs artwork:', artworkUrl);
            }
          } else {
            console.log('❌ Discogs API error:', response.status);
          }
        }
      } catch (error) {
        console.log('❌ Error fetching from Discogs:', error);
      }
    }

    // Fallback: Search MusicBrainz + Cover Art Archive
    if (!artworkUrl && artist && title) {
      try {
        console.log('🔍 Searching MusicBrainz for:', artist, '-', title);
        
        const searchQuery = encodeURIComponent(`${artist} ${title}`);
        const mbSearchUrl = `https://musicbrainz.org/ws/2/release?query=${searchQuery}&fmt=json&limit=1`;
        
        const mbResponse = await fetch(mbSearchUrl, {
          headers: {
            'User-Agent': 'VinylScanner/1.0 (contact@example.com)'
          }
        });
        
        if (mbResponse.ok) {
          const mbData = await mbResponse.json();
          
          if (mbData.releases && mbData.releases.length > 0) {
            const releaseId = mbData.releases[0].id;
            console.log('📀 Found MusicBrainz release:', releaseId);
            
            // Try Cover Art Archive
            const coverArtUrl = `https://coverartarchive.org/release/${releaseId}/front`;
            
            const coverResponse = await fetch(coverArtUrl, { method: 'HEAD' });
            if (coverResponse.ok) {
              artworkUrl = coverArtUrl;
              console.log('✅ Found Cover Art Archive artwork:', artworkUrl);
            }
          }
        }
      } catch (error) {
        console.log('❌ Error searching MusicBrainz:', error);
      }
    }

    // Download and store artwork if found
    if (artworkUrl && item_id) {
      try {
        console.log('💾 Downloading artwork:', artworkUrl);
        
        const imageResponse = await fetch(artworkUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const fileExt = artworkUrl.includes('.jpg') ? 'jpg' : 'png';
          const fileName = `artwork/${item_id}-official.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vinyl_images')
            .upload(fileName, arrayBuffer, {
              contentType: `image/${fileExt}`,
              upsert: true
            });

          if (uploadError) {
            console.log('❌ Upload error:', uploadError);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('vinyl_images')
              .getPublicUrl(fileName);
            
            const storedImageUrl = urlData.publicUrl;
            console.log('✅ Artwork stored at:', storedImageUrl);

            // Update database record with official artwork
            console.log('🔄 Updating database for item_type:', item_type, 'item_id:', item_id);
            
            if (item_type === 'ai_scan_results') {
              // Update ai_scan_results table
              const { error: updateError } = await supabase
                .from('ai_scan_results')
                .update({ artwork_url: storedImageUrl })
                .eq('id', item_id);
                
              if (updateError) {
                console.log('❌ AI scan artwork update error:', updateError);
              } else {
                console.log('✅ AI scan updated with official artwork for item:', item_id);
              }
            } else {
              // Update legacy cd_scan/vinyl2_scan tables
              const table = media_type === 'cd' ? 'cd_scan' : 'vinyl2_scan';
              const imageColumn = media_type === 'cd' ? 'front_image' : 'catalog_image';
              
              // Only update if no image exists yet
              const { error: updateError } = await supabase
                .from(table)
                .update({ [imageColumn]: storedImageUrl })
                .eq('id', item_id)
                .is(imageColumn, null);
                
              if (updateError) {
                console.log('❌ Collection item artwork update error:', updateError);
              } else {
                console.log('✅ Collection item updated with official artwork');
              }
            }


            return new Response(JSON.stringify({ 
              success: true, 
              artwork_url: storedImageUrl,
              source: artworkUrl.includes('discogs') ? 'discogs' : 'musicbrainz'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.log('❌ Error downloading/storing artwork:', error);
      }
    }

    // Return result
    return new Response(JSON.stringify({ 
      success: !!artworkUrl,
      artwork_url: artworkUrl,
      message: artworkUrl ? 'Artwork found' : 'No artwork found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in fetch-album-artwork function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});