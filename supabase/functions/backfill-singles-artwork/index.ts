import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    const { 
      refetch_all = false, 
      batch_size = 10,
      mode = 'singles' // 'singles' | 'blog_posts'
    } = await req.json().catch(() => ({}));
    
    console.log(`🔧 Mode: ${mode}, Refetch All: ${refetch_all}, Batch Size: ${batch_size}`);

    // ==========================================
    // MODE: BLOG POSTS (artwork + tiktok queue)
    // ==========================================
    if (mode === 'blog_posts') {
      console.log('📝 Processing blog posts for artwork and TikTok queue...');

      // Find blog posts missing artwork or tiktok_video_url
      let query = supabase
        .from('blog_posts')
        .select('id, slug, album_cover_url, tiktok_video_url, yaml_frontmatter')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(batch_size);

      if (!refetch_all) {
        query = query.or('album_cover_url.is.null,tiktok_video_url.is.null');
      }

      const { data: posts, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch posts: ${fetchError.message}`);
      }

      if (!posts || posts.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No blog posts found to process',
          processed: 0,
          artworkFetched: 0,
          queuedForTiktok: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`📋 Found ${posts.length} blog posts to process`);

      const results = {
        processed: 0,
        artworkFetched: 0,
        queuedForTiktok: 0,
        errors: [] as string[],
      };

      for (const post of posts) {
        try {
          const frontmatter = post.yaml_frontmatter || {};
          const artist = frontmatter.artist || 'Unknown';
          const title = frontmatter.album || frontmatter.title || 'Unknown';

          console.log(`\n🎵 Processing: ${artist} - ${title}`);

          // Step 1: Fetch artwork if missing
          if (!post.album_cover_url) {
            console.log('📸 Fetching artwork...');
            
            const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                artist,
                title,
                media_type: 'album',
              }),
            });

            if (artworkResponse.ok) {
              const artworkData = await artworkResponse.json();
              
              if (artworkData.artworkUrl || artworkData.artwork_url) {
                const artworkUrl = artworkData.artworkUrl || artworkData.artwork_url;
                
                // Update blog post with artwork
                const { error: updateError } = await supabase
                  .from('blog_posts')
                  .update({ album_cover_url: artworkUrl })
                  .eq('id', post.id);

                if (!updateError) {
                  console.log('✅ Artwork saved:', artworkUrl);
                  results.artworkFetched++;
                  post.album_cover_url = artworkUrl; // Update local reference
                } else {
                  console.error('❌ Failed to save artwork:', updateError);
                }
              } else {
                console.log('⚠️ No artwork found');
              }
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Step 2: Queue for TikTok video if missing AND has artwork
          if (!post.tiktok_video_url && post.album_cover_url) {
            console.log('🎬 Queueing for TikTok video generation...');

            // Check if already in queue
            const { data: existingQueue } = await supabase
              .from('tiktok_video_queue')
              .select('id')
              .eq('blog_id', post.id)
              .maybeSingle();

            if (!existingQueue) {
              const { error: queueError } = await supabase
                .from('tiktok_video_queue')
                .insert({
                  blog_id: post.id,
                  album_cover_url: post.album_cover_url,
                  artist,
                  title,
                  priority: 100, // High priority for backfill
                  status: 'pending',
                });

              if (!queueError) {
                console.log('✅ Queued for TikTok generation');
                results.queuedForTiktok++;
              } else {
                console.error('❌ Failed to queue:', queueError);
                results.errors.push(`Queue error for ${post.slug}: ${queueError.message}`);
              }
            } else {
              console.log('⏭️ Already in TikTok queue');
            }
          }

          results.processed++;
        } catch (err) {
          console.error(`❌ Error processing ${post.slug}:`, err);
          results.errors.push(`${post.slug}: ${err.message}`);
        }
      }

      console.log('\n✅ Blog posts backfill complete:', results);

      return new Response(JSON.stringify({
        success: true,
        mode: 'blog_posts',
        ...results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==========================================
    // MODE: SINGLES (original functionality)
    // ==========================================
    const modeLabel = refetch_all ? '🔄 REFETCH ALL' : '🎨 MISSING ONLY';
    console.log(`${modeLabel} - Starting singles artwork backfill (batch size: ${batch_size})...`);

    // Get singles based on mode - limit to batch_size to prevent timeout
    let query = supabase
      .from('music_stories')
      .select('id, artist, single_name, slug, artwork_url, yaml_frontmatter')
      .not('single_name', 'is', null);
    
    if (!refetch_all) {
      query = query.is('artwork_url', null);
    }
    
    const { data: singles, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(batch_size);

    if (fetchError) {
      throw new Error(`Failed to fetch singles: ${fetchError.message}`);
    }

    // Also get total count for reporting
    const { count: totalMissing } = await supabase
      .from('music_stories')
      .select('*', { count: 'exact', head: true })
      .not('single_name', 'is', null)
      .is('artwork_url', null);

    if (!singles || singles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No singles found to process',
        processed: 0,
        updated: 0,
        failed: 0,
        remaining: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Processing batch of ${singles.length} singles (${totalMissing || 0} total missing artwork)`);

    let updated = 0;
    let failed = 0;

    for (const single of singles) {
      try {
        console.log(`🎵 Processing: ${single.artist} - ${single.single_name}`);

        // Extract discogs_id from yaml_frontmatter if available
        const discogsId = single.yaml_frontmatter?.discogs_id;
        const discogsUrl = discogsId ? `https://www.discogs.com/release/${discogsId}` : null;

        // Call fetch-album-artwork
        const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artist: single.artist,
            title: single.single_name,
            discogs_url: discogsUrl,
            media_type: 'single',
            item_id: single.id,
            item_type: 'music_stories'
          })
        });

        if (artworkResponse.ok) {
          const artworkData = await artworkResponse.json();
          if (artworkData.success && artworkData.artwork_url) {
            updated++;
            console.log(`✅ Added artwork for: ${single.artist} - ${single.single_name}`);
          } else {
            console.log(`⚠️ No artwork found for: ${single.artist} - ${single.single_name}`);
          }
        } else {
          failed++;
          console.error(`❌ Failed to fetch artwork for: ${single.artist} - ${single.single_name}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        failed++;
        console.error(`❌ Error processing ${single.artist} - ${single.single_name}:`, error);
      }
    }

    const remaining = (totalMissing || 0) - updated;
    console.log(`✅ Batch complete: ${updated} updated, ${failed} failed, ${remaining} remaining`);

    return new Response(JSON.stringify({
      success: true,
      mode: 'singles',
      message: `Batch processed: ${updated} updated`,
      batch_size: singles.length,
      updated,
      failed,
      remaining: Math.max(0, remaining),
      has_more: remaining > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Backfill error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
