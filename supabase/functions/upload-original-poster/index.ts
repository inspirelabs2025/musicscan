import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    const { eventId, imageBase64, metadata, fileName } = await req.json();

    console.log('📤 Uploading original poster for event:', eventId);

    if (!eventId || !imageBase64) {
      throw new Error('Missing required fields: eventId or imageBase64');
    }

    // Decode base64 image
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determine file extension from fileName or default to png
    const fileExt = fileName?.split('.').pop()?.toLowerCase() || 'png';
    const contentType = fileExt === 'jpg' || fileExt === 'jpeg' 
      ? 'image/jpeg' 
      : fileExt === 'webp' 
        ? 'image/webp' 
        : 'image/png';

    // Generate unique filename
    const filename = `${eventId}/original-${Date.now()}.${fileExt}`;

    console.log(`📁 Uploading file: ${filename} (${contentType})`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('time-machine-original-posters')
      .upload(filename, imageBuffer, {
        contentType,
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('time-machine-original-posters')
      .getPublicUrl(filename);

    console.log('✅ File uploaded successfully:', publicUrl);

    // Update event record
    const updateData: any = {
      original_poster_url: publicUrl,
      poster_source: 'original',
    };

    if (metadata) {
      updateData.original_poster_metadata = metadata;
    }

    const { error: updateError } = await supabase
      .from('time_machine_events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) {
      console.error('❌ Error updating event:', updateError);
      throw updateError;
    }

    console.log('🎉 Original poster uploaded and event updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        posterUrl: publicUrl,
        eventId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in upload-original-poster:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
