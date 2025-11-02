import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const discogsToken = Deno.env.get('DISCOGS_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to validate meaningful names
function isMeaningfulName(v?: string): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  const bad = ['unknown', 'unknown artist', 'unknown album', 'onbekend', 'onbekende', 'untitled', '—', '-'];
  return !bad.includes(s);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting blog slug fix process...');

    // Get all blog posts
    const { data: blogPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`📋 Found ${blogPosts?.length || 0} blog posts to process`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const blog of blogPosts || []) {
      try {
        console.log(`\n🔍 Processing blog: ${blog.id} (${blog.album_type})`);

        // Fetch album data based on type
        let albumData;
        let actualTableUsed = '';

        if (blog.album_type === 'cd') {
          const { data } = await supabase
            .from('cd_scan')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'cd_scan';
          }
        } else if (blog.album_type === 'vinyl') {
          const { data } = await supabase
            .from('vinyl2_scan')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'vinyl2_scan';
          }
        } else if (blog.album_type === 'ai') {
          const { data } = await supabase
            .from('ai_scan_results')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'ai_scan_results';
          }
        } else if (blog.album_type === 'release') {
          const { data } = await supabase
            .from('releases')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'releases';
          }
        } else if (blog.album_type === 'product') {
          const { data } = await supabase
            .from('platform_products')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'platform_products';
          }
        }

        if (!albumData) {
          console.log(`⚠️ Album data not found for blog ${blog.id}`);
          skipped++;
          continue;
        }

        // Fetch correct data from Discogs API if available
        let discogsArtist = albumData.artist;
        let discogsTitle = albumData.title?.replace(/\s*\[Metaalprint\]\s*$/, '').replace(/^.*?\s*-\s*/, '');

        if (actualTableUsed === 'platform_products' && albumData.discogs_url && discogsToken) {
          console.log('🎯 Fetching correct data from Discogs API...');
          try {
            const urlMatch = albumData.discogs_url.match(/\/(master|release)\/(\d+)/);
            if (urlMatch) {
              const [, type, id] = urlMatch;
              const discogsApiUrl = type === 'master'
                ? `https://api.discogs.com/masters/${id}`
                : `https://api.discogs.com/releases/${id}`;

              const discogsResponse = await fetch(discogsApiUrl, {
                headers: {
                  'Authorization': `Discogs token=${discogsToken}`,
                  'User-Agent': 'MusicScanApp/1.0'
                }
              });

              if (discogsResponse.ok) {
                const discogsData = await discogsResponse.json();
                discogsArtist = discogsData.artists?.[0]?.name || discogsData.artists_sort || discogsArtist;
                discogsTitle = discogsData.title || discogsTitle;
                console.log('✅ Fetched from Discogs:', { artist: discogsArtist, title: discogsTitle });
              }
            }
          } catch (error) {
            console.error('❌ Error fetching Discogs data:', error);
          }
        }

        // Determine effective values
        const effectiveArtist = actualTableUsed === 'platform_products' ? discogsArtist : albumData.artist;
        const effectiveTitle = actualTableUsed === 'platform_products' ? discogsTitle : albumData.title;
        const effectiveYear = albumData.year || albumData.release_year;

        // Check if we have meaningful names
        if (!isMeaningfulName(effectiveArtist) || !isMeaningfulName(effectiveTitle)) {
          console.log(`⏭️ Skipping blog ${blog.id}: incomplete metadata`, { effectiveArtist, effectiveTitle });
          skipped++;
          continue;
        }

        // Generate new slug
        const newSlug = `${effectiveArtist?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${effectiveTitle?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${effectiveYear || 'unknown'}`.replace(/--+/g, '-');

        // Check if slug changed
        if (newSlug === blog.slug) {
          console.log(`✓ Slug already correct: ${newSlug}`);
          skipped++;
          continue;
        }

        console.log(`🔄 Updating slug: "${blog.slug}" → "${newSlug}"`);

        // Update blog post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ slug: newSlug })
          .eq('id', blog.id);

        if (updateError) {
          console.error('❌ Error updating blog:', updateError);
          errors++;
        } else {
          console.log(`✅ Updated blog ${blog.id}`);
          updated++;
        }

      } catch (error) {
        console.error(`❌ Error processing blog ${blog.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        errors,
        total: blogPosts?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fix-blog-slugs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
