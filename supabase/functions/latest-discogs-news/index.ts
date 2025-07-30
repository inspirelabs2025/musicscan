import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year: number;
  thumb: string;
  format: string[];
  label: string[];
  genre: string[];
  style: string[];
  country: string;
  uri: string;
  release_id?: string;
  stored_image?: string;
}

// Cache for 10 minutes
let cachedReleases: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cachedReleases && (now - cacheTime) < CACHE_DURATION) {
      console.log('Returning cached releases');
      return new Response(JSON.stringify(cachedReleases), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      throw new Error('Discogs token not configured');
    }

    console.log('Fetching trending releases from Discogs...');
    
    // Get trending releases from Discogs
    const response = await fetch('https://api.discogs.com/database/search?type=release&sort=added%2Cdesc&per_page=50', {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'VinylCollector/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Discogs API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} releases from Discogs API`);
    
    // Initialize Supabase client for optional database lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Filter releases - last 3 years or no year specified
    const currentYear = new Date().getFullYear();
    const filteredReleases = data.results
      .filter((release: any) => {
        return !release.year || release.year >= (currentYear - 3);
      })
      .slice(0, 20);

    // Fetch high-quality artwork for releases
    const releasesWithArtwork = [];
    
    // Process releases in parallel for better performance
    const artworkPromises = filteredReleases.map(async (release: any) => {
      try {
        // Extract title and artist properly
        const titleParts = release.title?.split(' - ') || ['Unknown', 'Unknown'];
        const artist = titleParts.length > 1 ? titleParts[0] : (release.artist || 'Unknown Artist');
        const title = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (titleParts[0] || 'Unknown Title');
        
        let highQualityImage = release.thumb || '';
        let storedImageUrl = null;
        
        // Try to get high-quality image from Discogs API
        try {
          const discogsApiUrl = `https://api.discogs.com/releases/${release.id}`;
          const response = await fetch(discogsApiUrl, {
            headers: {
              'User-Agent': 'VinylScanner/1.0',
              'Authorization': `Discogs token=${discogsToken}`
            }
          });
          
          if (response.ok) {
            const detailData = await response.json();
            
            // Look for primary image or first available image
            if (detailData.images && detailData.images.length > 0) {
              const primaryImage = detailData.images.find((img: any) => img.type === 'primary') || detailData.images[0];
              highQualityImage = primaryImage.resource_url || primaryImage.uri || highQualityImage;
              
              // Download and store the image
              if (highQualityImage && highQualityImage !== release.thumb) {
                try {
                  const imageResponse = await fetch(highQualityImage);
                  if (imageResponse.ok) {
                    const imageBlob = await imageResponse.blob();
                    const arrayBuffer = await imageBlob.arrayBuffer();
                    const fileExt = highQualityImage.includes('.jpg') ? 'jpg' : 'png';
                    const fileName = `news-releases/${release.id}-cover.${fileExt}`;
                    
                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('vinyl_images')
                      .upload(fileName, arrayBuffer, {
                        contentType: `image/${fileExt}`,
                        upsert: true
                      });

                    if (!uploadError) {
                      // Get public URL
                      const { data: urlData } = supabase.storage
                        .from('vinyl_images')
                        .getPublicUrl(fileName);
                      
                      storedImageUrl = urlData.publicUrl;
                      console.log(`✅ Stored artwork for ${artist} - ${title}`);
                    }
                  }
                } catch (downloadError) {
                  console.log(`⚠️ Failed to download artwork for ${release.id}:`, downloadError);
                }
              }
            }
          }
        } catch (apiError) {
          console.log(`⚠️ Failed to fetch details for ${release.id}:`, apiError);
        }
        
        // Check if release exists in database
        let release_id = null;
        try {
          const { data: dbRelease } = await supabase
            .from('releases')
            .select('id')
            .eq('discogs_id', release.id)
            .single();
          
          if (dbRelease) {
            release_id = dbRelease.id;
          }
        } catch (dbError) {
          // Release doesn't exist in database, that's okay
        }
        
        const formattedRelease: DiscogsRelease = {
          id: release.id,
          title: title,
          artist: artist,
          year: release.year || new Date().getFullYear(),
          thumb: storedImageUrl || highQualityImage || release.thumb || '',
          format: release.format || [],
          label: release.label || [],
          genre: release.genre || [],
          style: release.style || [],
          country: release.country || '',
          uri: release.uri || '',
          release_id: release_id,
          stored_image: storedImageUrl
        };

        return formattedRelease;
        
      } catch (error) {
        console.error(`Error processing release ${release.id}:`, error);
        
        // Return basic release info as fallback
        const titleParts = release.title?.split(' - ') || ['Unknown', 'Unknown'];
        const artist = titleParts.length > 1 ? titleParts[0] : (release.artist || 'Unknown Artist');
        const title = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (titleParts[0] || 'Unknown Title');
        
        return {
          id: release.id,
          title: title,
          artist: artist,
          year: release.year || new Date().getFullYear(),
          thumb: release.thumb || '',
          format: release.format || [],
          label: release.label || [],
          genre: release.genre || [],
          style: release.style || [],
          country: release.country || '',
          uri: release.uri || '',
          release_id: null,
          stored_image: null
        };
      }
    });
    
    // Wait for all artwork processing to complete
    const formattedReleases = await Promise.all(artworkPromises);

    console.log(`Processed ${formattedReleases.length} recent Discogs releases`);

    const result = {
      success: true,
      releases: formattedReleases,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cachedReleases = result;
    cacheTime = now;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Discogs news:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      releases: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});