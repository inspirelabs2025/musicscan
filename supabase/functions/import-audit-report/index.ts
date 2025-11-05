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

    console.log('📊 Generating import audit report...');

    // Get all import log entries
    const { data: allItems, error: fetchError } = await supabase
      .from('discogs_import_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching import log:', fetchError);
      throw fetchError;
    }

    // Status breakdown
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      skipped: 0,
      failed: 0
    };

    // Product/Blog status
    let withProduct = 0;
    let withoutProduct = 0;
    let withBlog = 0;
    let withoutBlog = 0;
    let withBoth = 0;
    let withNeither = 0;

    // Error analysis
    const errorMap = new Map<string, number>();
    const topErrors: { message: string; count: number; item_ids: string[] }[] = [];

    // Items needing attention
    const needsProduct: any[] = [];
    const needsBlog: any[] = [];
    const hasMismatch: any[] = [];

    allItems?.forEach(item => {
      // Status counts
      if (item.status && statusCounts.hasOwnProperty(item.status)) {
        statusCounts[item.status as keyof typeof statusCounts]++;
      }

      // Product/Blog analysis
      const hasProduct = !!item.product_id;
      const hasBlog = !!item.blog_id;

      if (hasProduct) withProduct++;
      else withoutProduct++;

      if (hasBlog) withBlog++;
      else withoutBlog++;

      if (hasProduct && hasBlog) withBoth++;
      if (!hasProduct && !hasBlog) withNeither++;

      // Items needing attention
      if (!hasProduct && ['completed', 'skipped'].includes(item.status)) {
        needsProduct.push({
          id: item.id,
          discogs_release_id: item.discogs_release_id,
          artist: item.artist,
          title: item.title,
          status: item.status,
          error: item.error_message
        });
      }

      if (hasProduct && !hasBlog) {
        needsBlog.push({
          id: item.id,
          discogs_release_id: item.discogs_release_id,
          artist: item.artist,
          title: item.title,
          product_id: item.product_id,
          status: item.status,
          error: item.error_message
        });
      }

      // Check for mismatches (blog exists but product doesn't, or vice versa in unexpected ways)
      if (hasBlog && !hasProduct && !['completed', 'skipped'].includes(item.status)) {
        hasMismatch.push({
          id: item.id,
          discogs_release_id: item.discogs_release_id,
          artist: item.artist,
          title: item.title,
          product_id: item.product_id,
          blog_id: item.blog_id,
          status: item.status,
          issue: 'Has blog but no product and status is not completed/skipped'
        });
      }

      // Error tracking
      if (item.error_message) {
        const errorKey = item.error_message.substring(0, 100); // First 100 chars
        errorMap.set(errorKey, (errorMap.get(errorKey) || 0) + 1);
      }
    });

    // Sort errors by frequency
    Array.from(errorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([message, count]) => {
        const itemsWithError = allItems?.filter(
          item => item.error_message?.startsWith(message.substring(0, 50))
        ).map(item => item.id) || [];
        
        topErrors.push({
          message,
          count,
          item_ids: itemsWithError.slice(0, 5) // Show first 5 item IDs
        });
      });

    const report = {
      generated_at: new Date().toISOString(),
      total_items: allItems?.length || 0,
      status_breakdown: statusCounts,
      product_status: {
        with_product: withProduct,
        without_product: withoutProduct
      },
      blog_status: {
        with_blog: withBlog,
        without_blog: withoutBlog
      },
      combined_status: {
        with_both: withBoth,
        with_neither: withNeither,
        only_product: withProduct - withBoth,
        only_blog: withBlog - withBoth
      },
      needs_attention: {
        items_needing_product: needsProduct.length,
        items_needing_blog: needsBlog.length,
        items_with_mismatch: hasMismatch.length
      },
      top_errors: topErrors,
      sample_items_needing_blog: needsBlog.slice(0, 10),
      sample_items_needing_product: needsProduct.slice(0, 10),
      sample_mismatches: hasMismatch.slice(0, 10)
    };

    console.log('✅ Audit report generated');
    console.log(`   Total items: ${report.total_items}`);
    console.log(`   With both product & blog: ${report.combined_status.with_both}`);
    console.log(`   Need blog: ${report.needs_attention.items_needing_blog}`);
    console.log(`   Need product: ${report.needs_attention.items_needing_product}`);

    return new Response(
      JSON.stringify(report),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Error generating audit report:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
