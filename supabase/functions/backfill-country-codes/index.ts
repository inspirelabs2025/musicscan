import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectArtistCountry } from "../_shared/country-detection.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const BATCH_SIZE = 25;
const DELAY_BETWEEN_CALLS_MS = 1000; // 1 second between AI calls

interface BackfillStats {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  table: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: BackfillStats[] = [];
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { table, limit = BATCH_SIZE } = await req.json().catch(() => ({}));

    console.log(`🌍 Starting country code backfill (batch size: ${limit})...`);

    // Process tables in priority order: artist_stories → music_stories → blog_posts
    const tablesToProcess = table 
      ? [table] 
      : ['artist_stories', 'music_stories', 'blog_posts'];

    for (const tableName of tablesToProcess) {
      const tableStats: BackfillStats = {
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        table: tableName
      };

      console.log(`\n📋 Processing table: ${tableName}`);

      // Fetch records without country_code
      let query;
      if (tableName === 'artist_stories') {
        query = supabase
          .from('artist_stories')
          .select('id, artist_name')
          .is('country_code', null)
          .eq('is_published', true)
          .order('views_count', { ascending: false, nullsFirst: false })
          .limit(limit);
      } else if (tableName === 'music_stories') {
        query = supabase
          .from('music_stories')
          .select('id, artist')
          .is('country_code', null)
          .eq('is_published', true)
          .order('views_count', { ascending: false, nullsFirst: false })
          .limit(limit);
      } else if (tableName === 'blog_posts') {
        query = supabase
          .from('blog_posts')
          .select('id, yaml_frontmatter')
          .is('country_code', null)
          .eq('is_published', true)
          .order('views_count', { ascending: false, nullsFirst: false })
          .limit(limit);
      } else {
        console.log(`⚠️ Unknown table: ${tableName}`);
        continue;
      }

      const { data: records, error: fetchError } = await query;

      if (fetchError) {
        console.error(`❌ Error fetching from ${tableName}:`, fetchError);
        tableStats.failed = 1;
        stats.push(tableStats);
        continue;
      }

      if (!records || records.length === 0) {
        console.log(`✅ No records to process in ${tableName}`);
        stats.push(tableStats);
        continue;
      }

      console.log(`📊 Found ${records.length} records to process in ${tableName}`);

      // Process each record
      for (const record of records) {
        tableStats.processed++;
        
        // Extract artist name based on table structure
        let artistName: string | null = null;
        if (tableName === 'artist_stories') {
          artistName = (record as any).artist_name;
        } else if (tableName === 'music_stories') {
          artistName = (record as any).artist;
        } else if (tableName === 'blog_posts') {
          const frontmatter = (record as any).yaml_frontmatter;
          artistName = frontmatter?.artist || null;
        }

        if (!artistName) {
          console.log(`⚠️ Skipping record ${record.id}: no artist name`);
          tableStats.skipped++;
          continue;
        }

        // Detect country
        const countryCode = await detectArtistCountry(artistName, LOVABLE_API_KEY);

        if (countryCode) {
          // Update record with country code
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ country_code: countryCode })
            .eq('id', record.id);

          if (updateError) {
            console.error(`❌ Error updating ${tableName} record ${record.id}:`, updateError);
            tableStats.failed++;
          } else {
            console.log(`✅ Updated ${artistName} → ${countryCode}`);
            tableStats.successful++;
          }
        } else {
          console.log(`⚠️ Could not detect country for ${artistName}`);
          tableStats.skipped++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS_MS));
      }

      stats.push(tableStats);
    }

    const executionTime = Date.now() - startTime;
    const totalProcessed = stats.reduce((sum, s) => sum + s.processed, 0);
    const totalSuccessful = stats.reduce((sum, s) => sum + s.successful, 0);
    const totalFailed = stats.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = stats.reduce((sum, s) => sum + s.skipped, 0);

    console.log(`\n📊 Backfill Summary:`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Successful: ${totalSuccessful}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Execution time: ${executionTime}ms`);

    // Log to cronjob execution log
    try {
      await supabase.from('cronjob_execution_log').insert({
        function_name: 'backfill-country-codes',
        status: totalFailed === 0 ? 'success' : 'partial',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        items_processed: totalSuccessful,
        metadata: { stats, totalProcessed, totalSuccessful, totalFailed, totalSkipped }
      });
    } catch (logError) {
      console.error('❌ Error logging execution:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      stats,
      summary: {
        totalProcessed,
        totalSuccessful,
        totalFailed,
        totalSkipped,
        executionTimeMs: executionTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Backfill error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
