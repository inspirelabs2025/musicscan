import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Ben Dodson's iTunes Artwork Finder technique
async function fetchItunesArtwork(artist: string, title: string): Promise<{
  url: string | null;
  resolution: string | null;
}> {
  try {
    const searchQuery = `${artist} ${title}`.trim();
    const encodedQuery = encodeURIComponent(searchQuery);
    
    console.log('🍎 Searching iTunes API:', searchQuery);
    
    const itunesUrl = `https://itunes.apple.com/search?term=${encodedQuery}&entity=album&limit=5&country=NL`;
    
    const response = await fetch(itunesUrl, {
      headers: { 'User-Agent': 'VinylScanner/1.0' }
    });
    
    if (!response.ok) {
      console.log('❌ iTunes API error:', response.status);
      return { url: null, resolution: null };
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('⚠️ No iTunes results for:', searchQuery);
      return { url: null, resolution: null };
    }
    
    // Find best match with artist + title validation
    const normalizedArtist = artist.toLowerCase().trim();
    const normalizedTitle = title.toLowerCase().trim();
    
    const bestMatch = data.results.find((result: any) => {
      const resultArtist = (result.artistName || '').toLowerCase();
      const resultTitle = (result.collectionName || '').toLowerCase();
      
      const artistMatch = resultArtist.includes(normalizedArtist) || 
                          normalizedArtist.includes(resultArtist);
      const titleMatch = resultTitle.includes(normalizedTitle) || 
                         normalizedTitle.includes(resultTitle);
      
      return artistMatch && titleMatch;
    }) || data.results[0];
    
    if (!bestMatch?.artworkUrl100) {
      console.log('⚠️ No artwork URL in iTunes result');
      return { url: null, resolution: null };
    }
    
    // Ben Dodson's trick: transform URL for higher resolutions
    const baseUrl = bestMatch.artworkUrl100;
    
    const resolutions = [
      { size: '3000x3000', label: '3000x3000' },
      { size: '1400x1400', label: '1400x1400' },
      { size: '1200x1200', label: '1200x1200' },
      { size: '600x600', label: '600x600' }
    ];
    
    console.log('🔍 Checking available iTunes resolutions...');
    
    for (const res of resolutions) {
      const highResUrl = baseUrl.replace('100x100bb.jpg', `${res.size}bb.jpg`);
      
      try {
        const checkResponse = await fetch(highResUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        
        if (checkResponse.ok) {
          console.log(`✅ Found iTunes ${res.label} artwork`);
          return { url: highResUrl, resolution: res.label };
        }
      } catch {
        continue;
      }
    }
    
    // Fallback: 600x600 always works
    const fallbackUrl = baseUrl.replace('100x100bb.jpg', '600x600bb.jpg');
    console.log('✅ Using iTunes 600x600 fallback');
    return { url: fallbackUrl, resolution: '600x600' };
    
  } catch (error) {
    console.log('❌ iTunes fetch error:', error);
    return { url: null, resolution: null };
  }
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
    let artworkSource = null;
    let artworkResolution = null;

    // PRIORITY 1: iTunes API (Ben Dodson technique)
    if (artist && title) {
      const itunesResult = await fetchItunesArtwork(artist, title);
      
      if (itunesResult.url) {
        artworkUrl = itunesResult.url;
        artworkSource = 'itunes';
        artworkResolution = itunesResult.resolution;
        
        console.log(`✅ Using iTunes ${artworkResolution} artwork`);
      }
    }

    // PRIORITY 2: Discogs (fallback if iTunes fails)
    if (!artworkUrl && discogs_url) {
      try {
        console.log('🔍 Fallback to Discogs:', discogs_url);
        
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
              artworkSource = 'discogs';
              console.log('✅ Using Discogs artwork (fallback)');
            }
          } else {
            console.log('❌ Discogs API error:', response.status);
          }
        }
      } catch (error) {
        console.log('❌ Error fetching from Discogs:', error);
      }
    }

    // PRIORITY 3: MusicBrainz (last resort fallback)
    if (!artworkUrl && artist && title) {
      try {
        console.log('🔍 Last resort: MusicBrainz/Cover Art Archive');
        
        // Use more precise search with artist and recording filters
        const normalizedArtist = artist.toLowerCase().trim();
        const normalizedTitle = title.toLowerCase().trim();
        
        // Try multiple search strategies for better precision
        const searchStrategies = [
          // Strategy 1: Exact artist and title match
          `artist:"${artist}" AND recording:"${title}"`,
          // Strategy 2: Artist with title in release
          `artist:"${artist}" AND release:"${title}"`,
          // Strategy 3: Fallback to basic search but with more results for validation
          `${artist} ${title}`
        ];
        
        let foundRelease = null;
        let selectedStrategy = null;
        
        for (const [index, query] of searchStrategies.entries()) {
          console.log(`🎯 Trying search strategy ${index + 1}:`, query);
          
          const searchQuery = encodeURIComponent(query);
          const limit = index === 2 ? 5 : 3; // More results for fallback strategy
          const mbSearchUrl = `https://musicbrainz.org/ws/2/release?query=${searchQuery}&fmt=json&limit=${limit}&inc=artist-credits`;
          
          const mbResponse = await fetch(mbSearchUrl, {
            headers: {
              'User-Agent': 'VinylScanner/1.0 (contact@example.com)'
            }
          });
          
          if (mbResponse.ok) {
            const mbData = await mbResponse.json();
            
            if (mbData.releases && mbData.releases.length > 0) {
              // Validate artist match for each release
              for (const release of mbData.releases) {
                const releaseArtists = release['artist-credit'] || [];
                const matchingArtist = releaseArtists.find((ac: any) => {
                  const creditName = ac.artist?.name?.toLowerCase() || ac.name?.toLowerCase() || '';
                  return creditName.includes(normalizedArtist) || normalizedArtist.includes(creditName);
                });
                
                if (matchingArtist) {
                  foundRelease = release;
                  selectedStrategy = `Strategy ${index + 1}`;
                  console.log('✅ Artist validation passed for:', matchingArtist.artist?.name || matchingArtist.name);
                  console.log('📀 Selected MusicBrainz release:', foundRelease.id, 'using', selectedStrategy);
                  break;
                }
              }
              
              if (foundRelease) break;
            }
          }
          
          // Add delay between requests to be respectful
          if (index < searchStrategies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Try Cover Art Archive with validated release
        if (foundRelease) {
          const coverArtUrl = `https://coverartarchive.org/release/${foundRelease.id}/front`;
          
          const coverResponse = await fetch(coverArtUrl, { method: 'HEAD' });
          if (coverResponse.ok) {
            artworkUrl = coverArtUrl;
            artworkSource = 'musicbrainz';
            console.log('✅ Using MusicBrainz artwork (last resort)');
            console.log('🎯 Match validation: Used', selectedStrategy, 'for', artist, '-', title);
          } else {
            console.log('❌ No Cover Art Archive artwork for validated release:', foundRelease.id);
          }
        } else {
          console.log('⚠️ No artist-validated releases found for:', artist, '-', title);
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
            } else if (item_type === 'music_stories') {
              // Update music_stories table
              const { error: updateError } = await supabase
                .from('music_stories')
                .update({ artwork_url: storedImageUrl })
                .eq('id', item_id);
                
              if (updateError) {
                console.log('❌ Music story artwork update error:', updateError);
              } else {
                console.log('✅ Music story updated with official artwork for item:', item_id);
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
              source: artworkSource,
              resolution: artworkResolution
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
      source: artworkSource,
      resolution: artworkResolution,
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