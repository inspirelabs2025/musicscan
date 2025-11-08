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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📸 Processing ${files.length} photos for bulk upload`);
    
    const timestamp = Date.now();
    const uploadResults: { artistName: string; storagePath: string; fileName: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Extract artist name from filename (remove extension)
        const fileName = file.name;
        const artistName = fileName
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[-_]/g, ' ') // Replace - and _ with space
          .trim();
        
        if (!artistName || artistName.length < 2) {
          errors.push(`${fileName}: filename too short or invalid`);
          continue;
        }

        // Upload to storage bucket
        const storagePath = `bulk-posters/${timestamp}/${fileName}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { error: uploadError } = await supabase.storage
          .from('shop-products')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error(`Upload error for ${fileName}:`, uploadError);
          errors.push(`${fileName}: ${uploadError.message}`);
          continue;
        }

        // Insert into queue
        const { error: queueError } = await supabase
          .from('poster_processing_queue')
          .insert({
            storage_path: storagePath,
            artist_name: artistName,
            status: 'pending'
          });

        if (queueError) {
          console.error(`Queue insert error for ${fileName}:`, queueError);
          errors.push(`${fileName}: failed to queue - ${queueError.message}`);
          continue;
        }

        uploadResults.push({ artistName, storagePath, fileName });
        console.log(`✅ Queued: ${artistName} (${fileName})`);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        errors.push(`${file.name}: ${fileError.message}`);
      }
    }

    const summary = {
      total: files.length,
      successful: uploadResults.length,
      failed: errors.length,
      uploads: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('📊 Upload summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
