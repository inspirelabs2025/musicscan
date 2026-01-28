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

    const { batch_size = 100 } = await req.json().catch(() => ({}));

    console.log('🔄 Starting backfill-scan-releases with batch size:', batch_size);

    // Find ai_scan_results with discogs_id but no release_id
    const { data: aiScans, error: aiScanError } = await supabase
      .from('ai_scan_results')
      .select('id, discogs_id, discogs_url, artist, title, label, catalog_number, year, genre, country, media_type')
      .not('discogs_id', 'is', null)
      .is('release_id', null)
      .eq('status', 'completed')
      .limit(batch_size);

    if (aiScanError) {
      console.error('❌ Error fetching ai_scan_results:', aiScanError);
      throw aiScanError;
    }

    // Find vinyl2_scan with discogs_id but no release_id
    const { data: vinylScans, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('id, discogs_id, discogs_url, artist, title, label, catalog_number, year, genre, country')
      .not('discogs_id', 'is', null)
      .is('release_id', null)
      .limit(batch_size);

    if (vinylError) {
      console.error('❌ Error fetching vinyl2_scan:', vinylError);
      throw vinylError;
    }

    // Find cd_scan with discogs_id but no release_id
    const { data: cdScans, error: cdError } = await supabase
      .from('cd_scan')
      .select('id, discogs_id, discogs_url, artist, title, label, catalog_number, year, genre, country')
      .not('discogs_id', 'is', null)
      .is('release_id', null)
      .limit(batch_size);

    if (cdError) {
      console.error('❌ Error fetching cd_scan:', cdError);
      throw cdError;
    }

    console.log(`📊 Found: ${aiScans?.length || 0} ai_scans, ${vinylScans?.length || 0} vinyl scans, ${cdScans?.length || 0} CD scans to backfill`);

    let processed = 0;
    let linked = 0;
    let failed = 0;

    // Process ai_scan_results
    for (const scan of aiScans || []) {
      try {
        const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
          body: {
            discogs_id: scan.discogs_id,
            artist: scan.artist,
            title: scan.title,
            label: scan.label,
            catalog_number: scan.catalog_number,
            year: scan.year,
            format: scan.media_type === 'vinyl' ? 'Vinyl' : 'CD',
            genre: scan.genre,
            country: scan.country,
            discogs_url: scan.discogs_url,
          }
        });

        if (releaseError) {
          console.log(`⚠️ Release link failed for ai_scan ${scan.id}:`, releaseError);
          failed++;
        } else if (releaseData?.release_id) {
          await supabase.from('ai_scan_results')
            .update({ release_id: releaseData.release_id })
            .eq('id', scan.id);
          linked++;
          console.log(`✅ Linked ai_scan ${scan.id} to release ${releaseData.release_id}`);
        }
        processed++;
      } catch (error) {
        console.log(`❌ Error processing ai_scan ${scan.id}:`, error.message);
        failed++;
        processed++;
      }
    }

    // Process vinyl2_scan
    for (const scan of vinylScans || []) {
      try {
        const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
          body: {
            discogs_id: scan.discogs_id,
            artist: scan.artist,
            title: scan.title,
            label: scan.label,
            catalog_number: scan.catalog_number,
            year: scan.year,
            format: 'Vinyl',
            genre: scan.genre,
            country: scan.country,
            discogs_url: scan.discogs_url,
          }
        });

        if (releaseError) {
          console.log(`⚠️ Release link failed for vinyl ${scan.id}:`, releaseError);
          failed++;
        } else if (releaseData?.release_id) {
          await supabase.from('vinyl2_scan')
            .update({ release_id: releaseData.release_id })
            .eq('id', scan.id);
          linked++;
          console.log(`✅ Linked vinyl ${scan.id} to release ${releaseData.release_id}`);
        }
        processed++;
      } catch (error) {
        console.log(`❌ Error processing vinyl ${scan.id}:`, error.message);
        failed++;
        processed++;
      }
    }

    // Process cd_scan
    for (const scan of cdScans || []) {
      try {
        const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
          body: {
            discogs_id: scan.discogs_id,
            artist: scan.artist,
            title: scan.title,
            label: scan.label,
            catalog_number: scan.catalog_number,
            year: scan.year,
            format: 'CD',
            genre: scan.genre,
            country: scan.country,
            discogs_url: scan.discogs_url,
          }
        });

        if (releaseError) {
          console.log(`⚠️ Release link failed for cd ${scan.id}:`, releaseError);
          failed++;
        } else if (releaseData?.release_id) {
          await supabase.from('cd_scan')
            .update({ release_id: releaseData.release_id })
            .eq('id', scan.id);
          linked++;
          console.log(`✅ Linked cd ${scan.id} to release ${releaseData.release_id}`);
        }
        processed++;
      } catch (error) {
        console.log(`❌ Error processing cd ${scan.id}:`, error.message);
        failed++;
        processed++;
      }
    }

    const totalPending = (aiScans?.length || 0) + (vinylScans?.length || 0) + (cdScans?.length || 0);

    console.log(`✅ Backfill complete: ${processed} processed, ${linked} linked, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        linked,
        failed,
        remaining: totalPending > batch_size ? 'more batches needed' : 'all done',
        details: {
          ai_scans: aiScans?.length || 0,
          vinyl_scans: vinylScans?.length || 0,
          cd_scans: cdScans?.length || 0,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in backfill-scan-releases:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
