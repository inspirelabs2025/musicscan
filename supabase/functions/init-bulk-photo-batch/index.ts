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
    console.log('ℹ️ init-bulk-photo-batch version: v2025-11-12-2');

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

    // Create batch record with service role (bypasses RLS)
    const { data: batchData, error: batchError } = await supabase
      .from('batch_uploads')
      .insert({
        user_id: user.id,
        photo_urls: photoUrls,
        photo_metadata: { photos: metadata },
        image_count: photoUrls.length,
        media_type: 'vinyl', // must be 'vinyl' or 'cd' per CHECK constraint
        condition_grade: 'NM',
        status: 'pending'
      })
      .select()
      .single();

    if (batchError) {
      console.error('❌ batch_uploads insert failed:', {
        code: batchError.code,
        message: batchError.message,
        details: batchError.details,
        hint: batchError.hint
      });
      throw new Error(`batch_uploads insert failed: ${batchError.message} (code: ${batchError.code})`);
    }

    const batchId = batchData.id;
    console.log(`✅ Batch record created: ${batchId}`);

    // Queue items will be created by bulk-photo-batch-processor

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
