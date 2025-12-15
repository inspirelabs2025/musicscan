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

    console.log('🎄 Christmas batch processor starting...');

    // Fetch next pending item from queue
    const { data: queueItem, error: fetchError } = await supabase
      .from('christmas_import_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Queue fetch error: ${fetchError.message}`);
    }

    if (!queueItem) {
      console.log('🎄 No pending items in Christmas queue');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending items' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎄 Processing: ${queueItem.artist} - ${queueItem.song_title}`);

    // Mark as processing
    await supabase
      .from('christmas_import_queue')
      .update({ 
        status: 'processing',
        attempts: queueItem.attempts + 1
      })
      .eq('id', queueItem.id);

    // Step 1: Generate story + artwork
    console.log(`📖 Step 1: Generating story...`);
    const { data: storyResult, error: storyError } = await supabase.functions.invoke('generate-christmas-story', {
      body: {
        artist: queueItem.artist,
        song_title: queueItem.song_title,
        album: queueItem.album,
        year: queueItem.year,
        country_origin: queueItem.country_origin,
        decade: queueItem.decade,
        youtube_video_id: queueItem.youtube_video_id,
        is_classic: queueItem.is_classic,
        tags: queueItem.tags,
      }
    });

    if (storyError || !storyResult?.success) {
      const errorMsg = storyError?.message || storyResult?.error || 'Unknown error';
      console.error(`❌ Story generation failed: ${errorMsg}`);

      // Check if we should retry
      if (queueItem.attempts < 3) {
        await supabase
          .from('christmas_import_queue')
          .update({ 
            status: 'pending',
            error_message: errorMsg
          })
          .eq('id', queueItem.id);
      } else {
        await supabase
          .from('christmas_import_queue')
          .update({ 
            status: 'failed',
            error_message: `Max attempts reached: ${errorMsg}`
          })
          .eq('id', queueItem.id);
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMsg 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const storyId = storyResult.story_id;
    console.log(`✅ Story created: ${storyId}`);

    // Fetch the created story to get artwork URL
    const { data: story } = await supabase
      .from('music_stories')
      .select('artwork_url, artist_name, single_name, slug')
      .eq('id', storyId)
      .single();

    const artworkUrl = story?.artwork_url;
    const productIds: string[] = [];

    // Step 2: Create Products (only if we have artwork)
    if (artworkUrl) {
      console.log(`🎨 Artwork found: ${artworkUrl}`);

      // Step 2a: Create Poster Products (7 styles)
      console.log(`🖼️ Step 2a: Creating poster products...`);
      try {
        const { data: posterResult } = await supabase.functions.invoke('create-poster-product', {
          body: {
            artist: queueItem.artist,
            title: queueItem.song_title,
            imageUrl: artworkUrl,
            tags: ['christmas', 'kerst', 'poster'],
            category: 'POSTER'
          }
        });
        if (posterResult?.productId) {
          productIds.push(posterResult.productId);
          console.log(`✅ Poster created: ${posterResult.productId}`);
        }
      } catch (e) {
        console.error('Poster creation failed:', e);
      }

      // Step 2b: Create Canvas Product (1 warm grayscale)
      console.log(`🎨 Step 2b: Creating canvas product...`);
      try {
        const { data: canvasResult } = await supabase.functions.invoke('create-canvas-product', {
          body: {
            artist: queueItem.artist,
            title: queueItem.song_title,
            imageUrl: artworkUrl,
            tags: ['christmas', 'kerst', 'canvas'],
            category: 'CANVAS'
          }
        });
        if (canvasResult?.productId) {
          productIds.push(canvasResult.productId);
          console.log(`✅ Canvas created: ${canvasResult.productId}`);
        }
      } catch (e) {
        console.error('Canvas creation failed:', e);
      }

      // Step 2c: Create T-shirt Products (7 styles)
      console.log(`👕 Step 2c: Creating T-shirt products...`);
      try {
        const { data: tshirtResult } = await supabase.functions.invoke('create-tshirt-products', {
          body: {
            artist: queueItem.artist,
            title: queueItem.song_title,
            imageUrl: artworkUrl,
            tags: ['christmas', 'kerst', 'tshirt'],
            category: 'tshirts'
          }
        });
        if (tshirtResult?.productIds) {
          productIds.push(...tshirtResult.productIds);
          console.log(`✅ T-shirts created: ${tshirtResult.productIds.length}`);
        }
      } catch (e) {
        console.error('T-shirt creation failed:', e);
      }

      // Step 2d: Create Sock Products (1 pop art) - Using create-christmas-sock
      console.log(`🧦 Step 2d: Creating sock products...`);
      try {
        const { data: sockResult } = await supabase.functions.invoke('create-christmas-sock', {
          body: {
            artist: queueItem.artist,
            title: queueItem.song_title,
            imageUrl: artworkUrl,
            tags: ['christmas', 'kerst', 'socks']
          }
        });
        if (sockResult?.productIds) {
          productIds.push(...sockResult.productIds);
          console.log(`✅ Socks created: ${sockResult.productIds.length}`);
        } else if (sockResult?.productId) {
          productIds.push(sockResult.productId);
          console.log(`✅ Sock created: ${sockResult.productId}`);
        }
      } catch (e) {
        console.error('Sock creation failed:', e);
      }
    } else {
      console.log(`⚠️ No artwork available, skipping product creation`);
    }

    // Step 3: Add to Facebook queue
    console.log(`📱 Step 3: Adding to Facebook queue...`);
    try {
      await supabase
        .from('singles_facebook_queue')
        .insert({
          single_id: storyId,
          artist: queueItem.artist,
          title: queueItem.song_title,
          artwork_url: artworkUrl,
          scheduled_for: new Date().toISOString(),
          status: 'pending',
          priority: 100 // High priority for new Christmas content
        });
      console.log(`✅ Added to Facebook queue`);
    } catch (e) {
      console.error('Facebook queue insertion failed:', e);
    }

    // Mark as completed
    await supabase
      .from('christmas_import_queue')
      .update({ 
        status: 'completed',
        music_story_id: storyId,
        product_ids: productIds,
        processed_at: new Date().toISOString(),
        error_message: null
      })
      .eq('id', queueItem.id);

    console.log(`🎄 ✅ Completed: ${queueItem.artist} - ${queueItem.song_title}`);
    console.log(`   📖 Story: ${storyId}`);
    console.log(`   🛍️ Products: ${productIds.length}`);
    console.log(`   📱 Facebook: queued`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: {
        artist: queueItem.artist,
        song_title: queueItem.song_title,
        story_id: storyId,
        product_count: productIds.length,
        product_ids: productIds,
        facebook_queued: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Christmas batch processor error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
