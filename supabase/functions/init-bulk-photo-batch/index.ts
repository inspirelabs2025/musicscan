import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrls, metadata } = await req.json();

    console.log(`🚀 Initializing bulk batch for ${photoUrls.length} photos`);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('User not authenticated');
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Create batch record with service role (bypasses RLS). Try allowed media_type values if constraint fails
    const candidates = ['photo', 'ai', 'art'];
    let batchData: any = null;
    let lastErr: any = null;
    let chosenMediaType: string | null = null;

    for (const mt of candidates) {
      const attempt = await supabase
        .from('batch_uploads')
        .insert({
          user_id: user.id,
          photo_urls: photoUrls,
          photo_metadata: { photos: metadata },
          image_count: photoUrls.length,
          media_type: mt,
          condition_grade: 'NM',
          status: 'queued',
          file_paths: []
        })
        .select()
        .single();

      if (!attempt.error) {
        batchData = attempt.data;
        chosenMediaType = mt;
        break;
      }

      lastErr = attempt.error;
      console.warn(`⚠️ batch_uploads insert failed for media_type='${mt}':`, {
        code: attempt.error.code,
        message: attempt.error.message,
        details: attempt.error.details,
      });

      // If it's not the media_type check constraint, stop trying
      if (attempt.error.code && attempt.error.code !== '23514') {
        break;
      }
    }

    if (!batchData) {
      console.error('❌ batch_uploads insert failed after trying candidates', {
        tried: candidates,
        code: lastErr?.code,
        message: lastErr?.message,
        details: lastErr?.details,
        hint: lastErr?.hint,
      });
      throw new Error(`batch_uploads insert failed: ${lastErr?.message} (code: ${lastErr?.code})`);
    }

    console.log(`✅ Batch record created with media_type='${chosenMediaType}': ${batchData.id}`);

    // Create queue items for each photo
    const queueItems = photoUrls.map((url: string, index: number) => ({
      batch_id: batchId,
      item_type: 'photo_batch',
      status: 'pending',
      metadata: {
        photo_url: url,
        ...metadata[index]
      }
    }));

    const { error: queueError } = await supabase
      .from('batch_queue_items')
      .insert(queueItems);

    if (queueError) {
      console.error('❌ batch_queue_items insert failed:', {
        message: queueError.message,
        code: queueError.code,
        details: queueError.details,
        hint: queueError.hint
      });
      throw new Error(`batch_queue_items insert failed: ${queueError.message} (code: ${queueError.code})`);
    }

    console.log(`✅ Created ${queueItems.length} queue items`);

    // Start bulk processing (fire-and-forget)
    const { error: functionError } = await supabase.functions.invoke(
      'bulk-photo-batch-processor',
      {
        body: {
          batchId,
          photoUrls,
          metadata
        }
      }
    );

    if (functionError) {
      console.error('⚠️ bulk-photo-batch-processor invocation failed:', functionError);
      // Don't throw - batch is created, processing can be retried
    } else {
      console.log(`✅ Bulk processor started for batch ${batchId}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        message: `Batch initialized with ${photoUrls.length} photos`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ init-bulk-photo-batch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
