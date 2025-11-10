import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📸 Generating photo sitemap...');

    // Fetch all published photos
    const { data: photos, error } = await supabase
      .from('photos')
      .select('seo_slug, published_at, updated_at')
      .eq('status', 'published')
      .not('seo_slug', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }

    console.log(`📸 Found ${photos?.length || 0} published photos`);

    // Generate XML
    const baseUrl = 'https://www.musicscan.app';
    const urlEntries = photos?.map(photo => {
      const lastmod = photo.updated_at || photo.published_at;
      return `  <url>
    <loc>${baseUrl}/photo/${photo.seo_slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n') || '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    console.log('✅ Photo sitemap generated successfully');

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('Error in generate-photo-sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
