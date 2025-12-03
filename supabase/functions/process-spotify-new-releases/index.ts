import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

// Configuration
const MAX_RELEASES_TO_FETCH = 200;  // Fetch up to 200 releases
const MAX_PROCESS_PER_RUN = 20;     // Process max 20 new releases per run
const DISCOGS_DELAY_MS = 1500;      // Delay between Discogs API calls
const BLOG_PRIORITY = 100;          // Highest priority for new releases (100 = top)

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  images: { url: string }[];
  release_date: string;
  album_type: string;
  total_tracks: number;
  external_urls: { spotify: string };
}

interface DiscogsSearchResult {
  id: number;
  title: string;
  year: string;
  cover_image: string;
  master_id?: number;
}

async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getSpotifyNewReleasesWithPagination(
  accessToken: string, 
  maxReleases: number = 200
): Promise<SpotifyAlbum[]> {
  const allAlbums: SpotifyAlbum[] = [];
  const pageSize = 50;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore && allAlbums.length < maxReleases) {
    const url = `https://api.spotify.com/v1/browse/new-releases?country=NL&limit=${pageSize}&offset=${offset}`;
    
    console.log(`Fetching releases: offset=${offset}, limit=${pageSize}`);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Spotify new releases: ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.albums?.items || [];
    
    allAlbums.push(...items);
    offset += pageSize;
    hasMore = data.albums?.next !== null && items.length === pageSize;
    
    console.log(`Fetched ${allAlbums.length} releases so far`);
    
    // Small delay between requests
    if (hasMore && allAlbums.length < maxReleases) {
      await delay(100);
    }
  }
  
  // Deduplicate
  const uniqueAlbums = Array.from(
    new Map(allAlbums.map(album => [album.id, album])).values()
  );
  
  return uniqueAlbums.slice(0, maxReleases);
}

async function searchDiscogs(artist: string, album: string): Promise<DiscogsSearchResult | null> {
  const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
  
  if (!DISCOGS_TOKEN) {
    console.log('DISCOGS_TOKEN not configured');
    return null;
  }

  try {
    const cleanArtist = artist.replace(/[^\w\s]/g, '').trim();
    const cleanAlbum = album.replace(/[^\w\s]/g, '').trim();
    
    const query = encodeURIComponent(`${cleanArtist} ${cleanAlbum}`);
    const url = `https://api.discogs.com/database/search?q=${query}&type=release&per_page=5`;
    
    console.log(`Searching Discogs for: ${cleanArtist} - ${cleanAlbum}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'MusicScanApp/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Discogs search failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const bestMatch = data.results.find((r: any) => 
        r.title?.toLowerCase().includes(cleanArtist.toLowerCase())
      ) || data.results[0];
      
      console.log(`Found Discogs match: ${bestMatch.title} (ID: ${bestMatch.id})`);
      return bestMatch;
    }
    
    console.log('No Discogs results found');
    return null;
  } catch (error) {
    console.error('Discogs search error:', error);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🎵 Starting Spotify new releases processing (automated)...');
    
    // Step 1: Get Spotify new releases WITH PAGINATION
    const accessToken = await getSpotifyAccessToken();
    const spotifyAlbums = await getSpotifyNewReleasesWithPagination(accessToken, MAX_RELEASES_TO_FETCH);
    
    console.log(`Found ${spotifyAlbums.length} Spotify new releases (max ${MAX_RELEASES_TO_FETCH})`);
    
    if (spotifyAlbums.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new releases found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get already processed releases
    const { data: processedReleases } = await supabase
      .from('spotify_new_releases_processed')
      .select('spotify_album_id');
    
    const processedIds = new Set(processedReleases?.map(r => r.spotify_album_id) || []);
    
    // Step 3: Filter out already processed
    const newReleases = spotifyAlbums.filter(album => !processedIds.has(album.id));
    console.log(`${newReleases.length} releases not yet processed`);
    
    if (newReleases.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All releases already processed', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Process releases (max MAX_PROCESS_PER_RUN per run to avoid timeouts)
    const toProcess = newReleases.slice(0, MAX_PROCESS_PER_RUN);
    const results: any[] = [];
    
    // Get or create batch for blog generation
    let { data: activeBatch } = await supabase
      .from('batch_processing_status')
      .select('id')
      .eq('process_type', 'blog_generation')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let batchId = activeBatch?.id;
    
    if (!batchId) {
      const { data: newBatch } = await supabase
        .from('batch_processing_status')
        .insert({
          process_type: 'blog_generation',
          status: 'pending',
          total_items: toProcess.length
        })
        .select()
        .single();
      
      batchId = newBatch?.id;
    }
    
    for (const album of toProcess) {
      const artistName = album.artists.map(a => a.name).join(', ');
      const albumName = album.name;
      const imageUrl = album.images[0]?.url;
      
      console.log(`\n📀 Processing: ${artistName} - ${albumName}`);
      
      // Insert tracking record
      const { data: trackingRecord, error: insertError } = await supabase
        .from('spotify_new_releases_processed')
        .insert({
          spotify_album_id: album.id,
          artist: artistName,
          album_name: albumName,
          release_date: album.release_date,
          spotify_url: album.external_urls.spotify,
          image_url: imageUrl,
          status: 'processing'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`Failed to create tracking record: ${insertError.message}`);
        continue;
      }
      
      try {
        // Search Discogs with rate limiting
        await delay(DISCOGS_DELAY_MS);
        const discogsResult = await searchDiscogs(artistName, albumName);
        
        if (!discogsResult) {
          await supabase
            .from('spotify_new_releases_processed')
            .update({
              status: 'no_discogs_match',
              processed_at: new Date().toISOString()
            })
            .eq('id', trackingRecord.id);
          
          results.push({
            album: albumName,
            artist: artistName,
            status: 'no_discogs_match'
          });
          continue;
        }
        
        // Update with Discogs ID
        await supabase
          .from('spotify_new_releases_processed')
          .update({ discogs_id: discogsResult.id })
          .eq('id', trackingRecord.id);
        
        // Create ART product
        console.log(`🎨 Creating ART product for Discogs ID: ${discogsResult.id}`);
        
        const { data: productData, error: productError } = await supabase.functions.invoke('create-art-product', {
          body: { discogs_id: discogsResult.id }
        });
        
        let productId = null;
        if (productError) {
          console.error(`Product creation failed: ${productError.message}`);
        } else if (productData?.product_id) {
          productId = productData.product_id;
          console.log(`✅ Product created: ${productId}`);
          
          await supabase
            .from('spotify_new_releases_processed')
            .update({ product_id: productId })
            .eq('id', trackingRecord.id);
        } else if (productData?.already_exists) {
          console.log('Product already exists');
          productId = productData.product_id;
        }
        
        // Queue blog generation with HIGHEST priority (100)
        if (batchId && productId) {
          const { data: existingBlog } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('album_id', productId)
            .maybeSingle();
          
          if (!existingBlog) {
            console.log(`📝 Queuing blog generation with priority ${BLOG_PRIORITY}`);
            
            const { error: queueError } = await supabase
              .from('batch_queue_items')
              .insert({
                batch_id: batchId,
                item_id: productId,
                item_type: 'spotify_new_release',
                priority: BLOG_PRIORITY,
                status: 'pending',
                metadata: {
                  spotify_album_id: album.id,
                  artist: artistName,
                  album_name: albumName,
                  discogs_id: discogsResult.id,
                  source: 'spotify_new_releases',
                  is_new_release: true
                }
              });
            
            if (queueError) {
              console.error(`Failed to queue blog: ${queueError.message}`);
            } else {
              console.log(`✅ Blog queued with priority ${BLOG_PRIORITY} (highest)`);
            }
          } else {
            console.log('Blog already exists');
            await supabase
              .from('spotify_new_releases_processed')
              .update({ blog_id: existingBlog.id })
              .eq('id', trackingRecord.id);
          }
        }
        
        // Update final status
        await supabase
          .from('spotify_new_releases_processed')
          .update({
            status: productId ? 'completed' : 'product_failed',
            processed_at: new Date().toISOString()
          })
          .eq('id', trackingRecord.id);
        
        // Auto-post to Facebook
        if (productId) {
          const productUrl = `https://www.musicscan.app/product/${productId}`;
          const postTitle = `🆕 Nieuw: ${artistName} - ${albumName}`;
          const postContent = `Nieuwe release! ${artistName} heeft "${albumName}" uitgebracht. Ontdek dit album op MusicScan.`;
          
          try {
            console.log(`📘 Posting to Facebook: ${artistName} - ${albumName}`);
            await supabase.functions.invoke('post-to-facebook', {
              body: {
                content_type: 'product',
                title: postTitle,
                content: postContent,
                url: productUrl,
                image_url: imageUrl,
                artist: artistName,
                year: album.release_date?.substring(0, 4)
              }
            });
          } catch (fbError) {
            console.error('Facebook post error:', fbError);
          }
        }
        
        results.push({
          album: albumName,
          artist: artistName,
          discogs_id: discogsResult.id,
          product_id: productId,
          status: productId ? 'completed' : 'product_failed'
        });
        
      } catch (error) {
        console.error(`Error processing ${albumName}:`, error);
        
        await supabase
          .from('spotify_new_releases_processed')
          .update({
            status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', trackingRecord.id);
        
        results.push({
          album: albumName,
          artist: artistName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'completed').length;
    const remaining = newReleases.length - toProcess.length;
    
    console.log(`\n🎉 Processing complete: ${successCount}/${results.length} successful`);
    if (remaining > 0) {
      console.log(`📋 ${remaining} releases remaining for next run`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} releases, ${successCount} successful`,
        processed: results.length,
        successful: successCount,
        remaining: remaining,
        total_available: spotifyAlbums.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in process-spotify-new-releases:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
