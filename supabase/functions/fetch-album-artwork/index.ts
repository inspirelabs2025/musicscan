import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to strip featured artists from song titles
function stripFeaturedArtists(title: string): string {
  return title
    .replace(/\(feat\.?\s+.+?\)/gi, '')
    .replace(/\[feat\.?\s+.+?\]/gi, '')
    .replace(/featuring\s+.+/gi, '')
    .replace(/ft\.?\s+.+/gi, '')
    .trim();
}

// Helper function for fuzzy string matching (simple Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
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

    const { discogs_url, master_id, artist, title, media_type, item_id, item_type } = await req.json();

    console.log('🎨 Starting artwork fetch for:', { artist, title, media_type, discogs_url });

    let artworkUrl = null;
    let artworkSource = null;

    // Strategy 1: Try Spotify first (best accuracy for singles)
    if (!artworkUrl && artist && title) {
      try {
        console.log('🎵 Searching Spotify for artwork:', artist, '-', title);
        
        // Get Spotify access token
        const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
        const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
        
        if (spotifyClientId && spotifyClientSecret) {
          const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${spotifyClientId}:${spotifyClientSecret}`)
            },
            body: 'grant_type=client_credentials'
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            
            // Strip featured artists for better matching
            const cleanTitle = stripFeaturedArtists(title);
            
            // Search for track
            const searchQuery = encodeURIComponent(`track:${cleanTitle} artist:${artist}`);
            const spotifyUrl = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=10`;
            
            const searchResponse = await fetch(spotifyUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              
              if (searchData.tracks?.items?.length > 0) {
                // Score results to find best match
                const normalizedArtist = artist.toLowerCase().trim();
                const normalizedTitle = cleanTitle.toLowerCase().trim();
                
                let bestMatch = null;
                let bestScore = 0;
                
                for (const track of searchData.tracks.items) {
                  const trackArtist = track.artists[0]?.name.toLowerCase().trim() || '';
                  const trackName = track.name.toLowerCase().trim();
                  
                  let score = 0;
                  
                  // CRITICAL: Exact artist match required (no fuzzy)
                  if (trackArtist === normalizedArtist) {
                    score += 50;
                  } else {
                    // Reject if not exact artist match
                    continue;
                  }
                  
                  // Exact title match
                  if (trackName === normalizedTitle) {
                    score += 50;
                  } else {
                    const titleSim = calculateSimilarity(trackName, normalizedTitle);
                    if (titleSim >= 90) {
                      score += Math.floor(titleSim / 2);
                    }
                  }
                  
                  if (score > bestScore && score >= 95) {
                    bestScore = score;
                    bestMatch = track;
                  }
                }
                
                if (bestMatch?.album?.images?.[0]?.url) {
                  artworkUrl = bestMatch.album.images[0].url;
                  artworkSource = 'spotify';
                  console.log('✅ Found Spotify artwork (score:', bestScore, '):', artworkUrl);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error fetching from Spotify:', error.message);
      }
    }

    // Strategy 2: Try Master ID (best quality, official artwork)
    if (master_id) {
      try {
        console.log('🎯 Using Master ID for artwork (highest priority):', master_id);
        const masterUrl = `https://api.discogs.com/masters/${master_id}`;
        
        const response = await fetch(masterUrl, {
          headers: {
            'User-Agent': 'VinylScanner/1.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            artworkUrl = data.images[0].uri;
            artworkSource = 'discogs-master';
            console.log('✅ Found Master artwork (official):', artworkUrl);
          }
        }
      } catch (error) {
        console.log('⚠️ Error fetching from Discogs Master:', error.message);
      }
    }

    // Strategy 3: For products with discogs_url, try Discogs Release (fallback)
    const hasDiscogsUrl = discogs_url && discogs_url.includes('/release/');
    
    if (!artworkUrl && hasDiscogsUrl) {
      try {
        console.log('🔍 Trying Discogs Release URL as fallback:', discogs_url);
        
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
            if (data.images && data.images.length > 0) {
              artworkUrl = data.images[0].uri;
              artworkSource = 'discogs';
              console.log('✅ Found Discogs artwork:', artworkUrl);
            }
          }
        }
      } catch (error) {
        console.log('❌ Error fetching from Discogs:', error);
      }
    }

    // Strategy 4: Try iTunes Search API with strict filtering (fallback)
    if (!artworkUrl && artist && title) {
      try {
        // For singles, search songs first, then albums as fallback
        const entityType = media_type === 'single' ? 'song' : 'album';
        
        // Strip featured artists for better matching
        const cleanTitle = stripFeaturedArtists(title);
        const originalTitle = title;
        
        console.log(`🍎 Searching iTunes for ${entityType}:`, artist, '-', cleanTitle);
        if (cleanTitle !== originalTitle) {
          console.log('📝 Stripped featured artists:', originalTitle, '→', cleanTitle);
        }
        
        const itunesQuery = encodeURIComponent(`${artist} ${cleanTitle}`);
        const itunesUrl = `https://itunes.apple.com/search?term=${itunesQuery}&entity=${entityType}&limit=15`;
        
        const itunesResponse = await fetch(itunesUrl);
        if (itunesResponse.ok) {
          const itunesData = await itunesResponse.json();
          
          if (itunesData.results && itunesData.results.length > 0) {
            // Improved matching: normalize and compare both artist and title
            const normalizedArtist = artist.toLowerCase().trim();
            const normalizedTitle = cleanTitle.toLowerCase().trim();
            
            // Filter and score results with STRICT compilation/various artists rejection
            const scoredResults = itunesData.results
              .filter((r: any) => {
                // For singles, require trackName and track wrapper type
                if (media_type === 'single') {
                  if (r.wrapperType !== 'track' || !r.trackName) return false;
                  
                  // Validate single-specific metadata
                  if (r.trackCount && r.trackCount > 1) return false;
                  if (r.trackNumber && r.trackNumber > 1) return false;
                }
                
                // CRITICAL: Filter out compilations and various artists
                const artistName = (r.artistName || '').toLowerCase();
                const collectionName = (r.collectionName || '').toLowerCase();
                
                // Reject "Various Artists" releases
                if (artistName.includes('various') || artistName === 'various artists') {
                  console.log('❌ Rejected: Various Artists -', collectionName);
                  return false;
                }
                
                // Reject obvious compilations
                const compilationKeywords = [
                  'greatest hits', 'best of', 'collection', 'anthology',
                  'number ones', 'top hits', 'ultimate', 'essential',
                  'mixed', 'mixed by', 'dj', 'compilation', 'verzameling',
                  'now that', 'hitzone', 'top 40', 'de afrekening'
                ];
                
                for (const keyword of compilationKeywords) {
                  if (collectionName.includes(keyword)) {
                    console.log('❌ Rejected compilation:', collectionName);
                    return false;
                  }
                }
                
                // CRITICAL: Artist name MUST closely match the search artist (minimum 85%)
                const normalizedSearchArtist = artist.toLowerCase().trim();
                const similarity = calculateSimilarity(artistName, normalizedSearchArtist);
                
                if (similarity < 85) {
                  console.log(`❌ Rejected: Low artist similarity (${similarity.toFixed(0)}%) - "${r.artistName}" vs "${artist}"`);
                  return false;
                }
                
                return true;
              })
              .map((r: any) => {
                const resultArtist = (r.artistName || '').toLowerCase().trim();
                const resultTitle = (r.trackName || r.collectionName || '').toLowerCase().trim();
                
                // Calculate match score with HIGHER THRESHOLDS
                let score = 0;
                let matchDetails: string[] = [];
                
                // CRITICAL: Exact artist match REQUIRED (no fuzzy artist matching)
                if (resultArtist === normalizedArtist) {
                  score += 50; // Increased from 40
                  matchDetails.push('EXACT ARTIST');
                } else {
                  // NO fuzzy artist match accepted - too risky for singles
                  console.log(`⚠️ Skipping non-exact artist match: "${resultArtist}" vs "${normalizedArtist}"`);
                  return { result: r, score: 0, matchDetails: [], isSingle: false };
                }
                
                // Exact title match (very important)
                if (resultTitle === normalizedTitle) {
                  score += 50; // Increased from 40
                  matchDetails.push('EXACT TITLE');
                } else {
                  // High similarity title match only
                  const titleSimilarity = calculateSimilarity(resultTitle, normalizedTitle);
                  if (titleSimilarity >= 90) { // Stricter: 90% minimum
                    score += Math.floor(titleSimilarity / 2);
                    matchDetails.push(`fuzzy title (${titleSimilarity.toFixed(0)}%)`);
                  } else {
                    // Reject low similarity title matches
                    return { result: r, score: 0, matchDetails: [], isSingle: false };
                  }
                }
                
                // Bonus for single-specific validation
                if (media_type === 'single' && (r.trackCount === 1 || r.trackNumber === 1)) {
                  score += 15; // Increased from 10
                  matchDetails.push('VERIFIED SINGLE');
                }
                
                // Bonus for higher resolution artwork
                if (r.artworkUrl100 && r.artworkUrl100.includes('1200x1200')) {
                  score += 5;
                  matchDetails.push('high-res artwork');
                }
                
                return { 
                  result: r, 
                  score, 
                  matchDetails,
                  isSingle: r.trackCount === 1 || r.wrapperType === 'track'
                };
              });
            
            // Sort by score and pick best match
            scoredResults.sort((a, b) => b.score - a.score);
            
            if (scoredResults.length > 0) {
              const bestMatch = scoredResults[0];
              
              console.log(`🎯 Best iTunes match (score: ${bestMatch.score}):`, 
                bestMatch.result.artistName, '-', 
                bestMatch.result.trackName || bestMatch.result.collectionName);
              console.log(`📊 Match details:`, bestMatch.matchDetails.join(', '));
              console.log(`🎵 Type: ${bestMatch.isSingle ? 'Single' : 'Album'}`);
              
              // Require minimum score of 95 for quality matches (strict requirement)
              if (bestMatch.score >= 95 && bestMatch.result.artworkUrl100) {
                artworkUrl = bestMatch.result.artworkUrl100
                  .replace('100x100bb', '1200x1200bb')
                  .replace('100x100', '1200x1200');
                artworkSource = 'itunes';
                console.log('✅ Found iTunes artwork (high confidence):', artworkUrl);
              } else if (bestMatch.score >= 80) {
                console.log(`⚠️ iTunes match found but score too low (${bestMatch.score}/95 needed - STRICT threshold)`);
                console.log(`💡 Rejected: Artist="${bestMatch.result.artistName}", Title="${bestMatch.result.trackName || bestMatch.result.collectionName}"`);
              } else {
                console.log('⚠️ No good iTunes match found (score too low for strict threshold)');
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ Error fetching from iTunes:', error);
      }
    }

  // Skip Discogs fallback if already tried
  if (!artworkUrl && discogs_url && !hasDiscogsUrl) {
      try {
        console.log('🔍 Fetching from Discogs as fallback:', discogs_url);
        
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

    // Strategy 5: Try MusicBrainz + Cover Art Archive as last resort
    if (!artworkUrl && artist && title) {
      try {
        const normalizedArtist = artist.toLowerCase().trim();
        const normalizedTitle = title.toLowerCase().trim();
        
        // For singles, search recordings first
        if (media_type === 'single') {
          const cleanTitle = stripFeaturedArtists(title);
          console.log('🔍 Searching MusicBrainz recordings for single:', artist, '-', cleanTitle);
          if (cleanTitle !== title) {
            console.log('📝 Stripped featured artists for MusicBrainz:', title, '→', cleanTitle);
          }
          
          const recordingQuery = encodeURIComponent(`artist:"${artist}" AND recording:"${cleanTitle}"`);
          const mbRecordingUrl = `https://musicbrainz.org/ws/2/recording?query=${recordingQuery}&fmt=json&limit=5&inc=releases+artist-credits`;
          
          const mbResponse = await fetch(mbRecordingUrl, {
            headers: {
              'User-Agent': 'VinylScanner/1.0 (contact@example.com)'
            }
          });
          
          if (mbResponse.ok) {
            const mbData = await mbResponse.json();
            
            if (mbData.recordings && mbData.recordings.length > 0) {
              // Find best matching recording
              for (const recording of mbData.recordings) {
                const recordingArtists = recording['artist-credit'] || [];
                const matchingArtist = recordingArtists.find((ac: any) => {
                  const creditName = ac.artist?.name?.toLowerCase() || ac.name?.toLowerCase() || '';
                  return creditName.includes(normalizedArtist) || normalizedArtist.includes(creditName);
                });
                
                if (matchingArtist && recording.releases && recording.releases.length > 0) {
                  // Try each release for cover art
                  for (const release of recording.releases) {
                    const coverArtUrl = `https://coverartarchive.org/release/${release.id}/front`;
                    
                    try {
                      const coverResponse = await fetch(coverArtUrl, { method: 'HEAD' });
                      if (coverResponse.ok) {
                        artworkUrl = coverArtUrl;
                        artworkSource = 'musicbrainz';
                        console.log('✅ Found Cover Art for single from recording:', artworkUrl);
                        break;
                      }
                    } catch (e) {
                      // Continue to next release
                    }
                  }
                  
                  if (artworkUrl) break;
                }
              }
            }
          }
        }
        
        // Fallback to release search for albums or if recording search failed
        if (!artworkUrl) {
          console.log('🔍 Searching MusicBrainz releases for:', artist, '-', title);
          
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
              console.log('✅ Found Cover Art Archive artwork:', artworkUrl);
              console.log('🎯 Match validation: Used', selectedStrategy, 'for', artist, '-', title);
            } else {
              console.log('❌ No Cover Art Archive artwork for validated release:', foundRelease.id);
            }
          } else {
            console.log('⚠️ No artist-validated releases found for:', artist, '-', title);
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
            console.log(`🔄 Updating ${item_type} with artwork from ${artworkSource}:`, item_id);
            
            if (item_type === 'ai_scan_results') {
              // Update ai_scan_results table
              const { error: updateError } = await supabase
                .from('ai_scan_results')
                .update({ artwork_url: storedImageUrl })
                .eq('id', item_id);
                
              if (updateError) {
                console.log('❌ AI scan artwork update error:', updateError);
              } else {
                console.log(`✅ Updated ai_scan_results with ${artworkSource} artwork:`, item_id);
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
                console.log(`✅ Updated music_stories with ${artworkSource} artwork:`, item_id);
              }
            } else if (item_type === 'platform_products') {
              // Update platform_products table
              const { data: existingProduct, error: fetchError } = await supabase
                .from('platform_products')
                .select('images')
                .eq('id', item_id)
                .single();
              
              if (fetchError) {
                console.log('❌ Error fetching existing product:', fetchError);
              } else {
                const existingImages = existingProduct?.images || [];
                const updatedImages = [storedImageUrl, ...existingImages.filter((url: string) => url !== storedImageUrl)];
                
                const { error: updateError } = await supabase
                  .from('platform_products')
                  .update({ 
                    primary_image: storedImageUrl,
                    images: updatedImages
                  })
                  .eq('id', item_id);
                  
                if (updateError) {
                  console.log('❌ Platform product artwork update error:', updateError);
                } else {
                  console.log(`✅ Updated platform_products with ${artworkSource} artwork:`, item_id);
                }
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
              source: artworkSource || 'unknown'
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