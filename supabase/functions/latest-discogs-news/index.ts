import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  artwork?: string;
  thumb?: string;
  stored_image?: string;
  format?: string[] | string;
  label?: string[] | string;
  genre?: string[] | string;
  style?: string[];
  country?: string;
  uri?: string;
  database_id?: string;
  release_id?: string;
}

// Cache for releases (6 hours)
let cachedReleases: DiscogsRelease[] = [];
let cacheTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Fetching latest Discogs releases...');
    
    // Check cache first
    const now = Date.now();
    if (cachedReleases.length > 0 && (now - cacheTime) < CACHE_DURATION) {
      console.log('✅ Returning cached releases');
      return new Response(JSON.stringify({
        success: true,
        releases: cachedReleases,
        cached: true,
        cached_at: new Date(cacheTime).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch trending releases from Discogs API
    console.log('📡 Fetching from Discogs API...');
    const discogsResponse = await fetch('https://api.discogs.com/database/search?type=release&sort=hot&per_page=20', {
      headers: {
        'User-Agent': 'VinylValueScanner/1.0 +https://vinylvaluescanner.com',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });

    if (!discogsResponse.ok) {
      throw new Error(`Discogs API error: ${discogsResponse.status}`);
    }

    const discogsData = await discogsResponse.json();
    console.log(`📦 Found ${discogsData.results?.length || 0} releases`);

    // Process releases in parallel
    const rawReleases = await Promise.all(
      (discogsData.results || []).slice(0, 20).map(async (release: any) => {
        try {
          // Get detailed release information for better artwork
          const detailResponse = await fetch(`https://api.discogs.com/releases/${release.id}`, {
            headers: {
              'User-Agent': 'VinylValueScanner/1.0 +https://vinylvaluescanner.com',
              'Authorization': `Discogs token=${discogsToken}`
            }
          });

          let detailedRelease = release;
          if (detailResponse.ok) {
            detailedRelease = await detailResponse.json();
          }

          // Find the best quality image
          const images = detailedRelease.images || [];
          let bestImage = images.find((img: any) => img.type === 'primary') || images[0];
          let storedImageUrl = '';

          // Download and store artwork if available
          if (bestImage?.uri) {
            try {
              console.log(`🖼️ Processing image for: ${release.title}`);
              const imageResponse = await fetch(bestImage.uri);
              
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const fileName = `discogs-${release.id}-${Date.now()}.jpg`;
                
                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                  .from('news-images')
                  .upload(fileName, imageBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '31536000'
                  });

                if (!uploadError) {
                  const { data: publicUrl } = supabase.storage
                    .from('news-images')
                    .getPublicUrl(fileName);
                  
                  storedImageUrl = publicUrl.publicUrl;
                  console.log(`✅ Stored image: ${fileName}`);
                }
              }
            } catch (imageError) {
              console.warn(`⚠️ Failed to store image for ${release.title}:`, imageError);
            }
          }

          // Check if release exists in our database
          let databaseId = '';
          try {
            const { data: existingRelease } = await supabase
              .from('releases')
              .select('id')
              .eq('discogs_id', release.id)
              .maybeSingle();
            
            if (existingRelease) {
              databaseId = existingRelease.id;
            }
          } catch (dbError) {
            console.warn(`⚠️ Database check failed for ${release.title}:`, dbError);
          }

          // Format the release data
          return {
            id: release.id,
            title: detailedRelease.title || release.title,
            artist: Array.isArray(detailedRelease.artists) 
              ? detailedRelease.artists.map((a: any) => a.name).join(', ')
              : (detailedRelease.artists?.[0]?.name || 'Unknown Artist'),
            year: detailedRelease.year || release.year,
            artwork: bestImage?.uri || release.thumb,
            thumb: release.thumb,
            stored_image: storedImageUrl,
            format: detailedRelease.formats?.map((f: any) => f.name) || release.format,
            label: detailedRelease.labels?.map((l: any) => l.name) || [],
            genre: detailedRelease.genres || release.genre || [],
            style: detailedRelease.styles || release.style || [],
            country: detailedRelease.country || '',
            uri: release.uri,
            database_id: databaseId,
            release_id: storedImageUrl
          };
        } catch (error) {
          console.error(`❌ Error processing release ${release.id}:`, error);
          return {
            id: release.id,
            title: release.title,
            artist: 'Unknown Artist',
            thumb: release.thumb,
            uri: release.uri
          };
        }
      })
    );

    // Deduplicate releases by artist + title combination
    const deduplicatedReleases: DiscogsRelease[] = [];
    const seenCombinations = new Set<string>();

    for (const release of rawReleases) {
      if (!release || !release.artist || !release.title) continue;
      
      // Create a normalized key for deduplication
      const key = `${release.artist.toLowerCase().trim()}-${release.title.toLowerCase().trim()}`;
      
      if (!seenCombinations.has(key)) {
        seenCombinations.add(key);
        deduplicatedReleases.push(release);
      } else {
        // If we already have this combination, replace it if this one has better quality data
        const existingIndex = deduplicatedReleases.findIndex(r => 
          `${r.artist.toLowerCase().trim()}-${r.title.toLowerCase().trim()}` === key
        );
        
        if (existingIndex !== -1) {
          const existing = deduplicatedReleases[existingIndex];
          // Prefer releases with stored images, then artwork, then more complete data
          const haseBetterImage = release.stored_image && !existing.stored_image;
          const hasBetterArtwork = !release.stored_image && release.artwork && !existing.artwork;
          const hasMoreData = (release.genre?.length || 0) > (existing.genre?.length || 0);
          
          if (haseBetterImage || hasBetterArtwork || hasMoreData) {
            deduplicatedReleases[existingIndex] = release;
          }
        }
      }
    }

    // Limit to 12 unique releases for better performance
    const releases = deduplicatedReleases.slice(0, 12);

    // Update cache
    cachedReleases = releases;
    cacheTime = now;

    console.log(`✅ Successfully processed ${releases.length} unique releases (from ${rawReleases.length} total)`);

    return new Response(JSON.stringify({
      success: true,
      releases: releases,
      cached: false,
      fetched_at: new Date().toISOString(),
      total: releases.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in latest-discogs-news:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      releases: [],
      cached_fallback: cachedReleases.length > 0 ? cachedReleases : []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});