import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPORT_EMAIL = "rogiervisser76@gmail.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📊 Generating daily status report...');

    // Determine report period (last 8 hours for twice daily reports)
    const periodStart = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();
    const reportTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // 1. Get cronjob execution stats
    const { data: cronjobStats, error: cronjobError } = await supabase
      .from('cronjob_execution_log')
      .select('function_name, status, items_processed, execution_time_ms, error_message')
      .gte('started_at', periodStart)
      .order('started_at', { ascending: false });

    if (cronjobError) throw cronjobError;

    // Aggregate cronjob stats by function
    const cronjobSummary: Record<string, { 
      runs: number; 
      successful: number; 
      failed: number; 
      itemsProcessed: number;
      avgTime: number;
      errors: string[];
    }> = {};

    for (const log of cronjobStats || []) {
      if (!cronjobSummary[log.function_name]) {
        cronjobSummary[log.function_name] = { 
          runs: 0, successful: 0, failed: 0, itemsProcessed: 0, avgTime: 0, errors: [] 
        };
      }
      const summary = cronjobSummary[log.function_name];
      summary.runs++;
      if (log.status === 'completed' || log.status === 'success') {
        summary.successful++;
      } else if (log.status === 'failed' || log.status === 'error') {
        summary.failed++;
        if (log.error_message) summary.errors.push(log.error_message);
      }
      summary.itemsProcessed += log.items_processed || 0;
      summary.avgTime += log.execution_time_ms || 0;
    }

    // Calculate averages
    for (const key in cronjobSummary) {
      if (cronjobSummary[key].runs > 0) {
        cronjobSummary[key].avgTime = Math.round(cronjobSummary[key].avgTime / cronjobSummary[key].runs);
      }
    }

    // 2. Get singles queue status
    const { data: singlesStats } = await supabase
      .from('singles_import_queue')
      .select('status')
      .then(res => {
        const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
        for (const item of res.data || []) {
          counts[item.status as keyof typeof counts] = (counts[item.status as keyof typeof counts] || 0) + 1;
        }
        return { data: counts };
      });

    // Get singles processed in this period
    const { count: singlesProcessedPeriod } = await supabase
      .from('singles_import_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'failed'])
      .gte('processed_at', periodStart);

    // 3. Get batch queue status
    const { data: batchQueueStats } = await supabase
      .from('batch_queue_items')
      .select('item_type, status')
      .then(res => {
        const byType: Record<string, Record<string, number>> = {};
        for (const item of res.data || []) {
          if (!byType[item.item_type]) byType[item.item_type] = {};
          byType[item.item_type][item.status] = (byType[item.item_type][item.status] || 0) + 1;
        }
        return { data: byType };
      });

    // 4. Get blog posts created in period
    const { count: newBlogs } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    // 5. Get music stories created in period
    const { count: newMusicStories } = await supabase
      .from('music_stories')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    // 6. Get artist stories created in period
    const { count: newArtistStories } = await supabase
      .from('artist_stories')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    // 7. Get IndexNow submissions
    const { count: indexNowSubmitted } = await supabase
      .from('indexnow_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', periodStart);

    // 8. Get discogs import status
    const { data: discogsStats } = await supabase
      .from('discogs_import_log')
      .select('status')
      .then(res => {
        const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
        for (const item of res.data || []) {
          const status = item.status as string;
          if (status in counts) {
            counts[status as keyof typeof counts]++;
          }
        }
        return { data: counts };
      });

    // Build HTML email
    const cronjobTableRows = Object.entries(cronjobSummary)
      .sort((a, b) => b[1].runs - a[1].runs)
      .map(([name, stats]) => `
        <tr style="${stats.failed > 0 ? 'background-color: #ffebee;' : ''}">
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${stats.runs}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: green;">${stats.successful}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: ${stats.failed > 0 ? 'red' : 'inherit'};">${stats.failed}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${stats.itemsProcessed}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${stats.avgTime}ms</td>
        </tr>
      `).join('');

    const batchQueueRows = Object.entries(batchQueueStats || {})
      .map(([type, statuses]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${type}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${statuses['pending'] || 0}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${statuses['processing'] || 0}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: green;">${statuses['completed'] || 0}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: ${(statuses['failed'] || 0) > 0 ? 'red' : 'inherit'};">${statuses['failed'] || 0}</td>
        </tr>
      `).join('');

    const hasIssues = Object.values(cronjobSummary).some(s => s.failed > 0) || 
                      (singlesStats?.failed || 0) > 0;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MusicScan Status Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📊 MusicScan Status Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportTime}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
          ${hasIssues ? `
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
              <strong>⚠️ Er zijn problemen gedetecteerd!</strong> Controleer de details hieronder.
            </div>
          ` : `
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px;">
              <strong>✅ Alles draait soepel!</strong> Geen problemen gedetecteerd.
            </div>
          `}
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📈 Samenvatting (laatste 8 uur)</h2>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${newBlogs || 0}</div>
              <div style="color: #666;">Nieuwe Blogs</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${newMusicStories || 0}</div>
              <div style="color: #666;">Nieuwe Music Stories</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${newArtistStories || 0}</div>
              <div style="color: #666;">Nieuwe Artist Stories</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${singlesProcessedPeriod || 0}</div>
              <div style="color: #666;">Singles Verwerkt</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${indexNowSubmitted || 0}</div>
              <div style="color: #666;">IndexNow Submissies</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${(cronjobStats || []).length}</div>
              <div style="color: #666;">Cronjob Runs</div>
            </div>
          </div>
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🎵 Singles Import Queue</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Status</th>
              <th style="padding: 10px; text-align: right;">Aantal</th>
            </tr>
            <tr><td style="padding: 8px;">⏳ Pending</td><td style="padding: 8px; text-align: right;">${singlesStats?.pending || 0}</td></tr>
            <tr><td style="padding: 8px;">🔄 Processing</td><td style="padding: 8px; text-align: right;">${singlesStats?.processing || 0}</td></tr>
            <tr><td style="padding: 8px;">✅ Completed</td><td style="padding: 8px; text-align: right; color: green;">${singlesStats?.completed || 0}</td></tr>
            <tr><td style="padding: 8px;">❌ Failed</td><td style="padding: 8px; text-align: right; color: ${(singlesStats?.failed || 0) > 0 ? 'red' : 'inherit'};">${singlesStats?.failed || 0}</td></tr>
          </table>
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📦 Batch Queues</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Type</th>
              <th style="padding: 10px; text-align: center;">Pending</th>
              <th style="padding: 10px; text-align: center;">Processing</th>
              <th style="padding: 10px; text-align: center;">Completed</th>
              <th style="padding: 10px; text-align: center;">Failed</th>
            </tr>
            ${batchQueueRows || '<tr><td colspan="5" style="padding: 8px; text-align: center;">Geen batch items</td></tr>'}
          </table>
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">⏰ Cronjob Executions</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; font-size: 13px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Function</th>
              <th style="padding: 10px; text-align: center;">Runs</th>
              <th style="padding: 10px; text-align: center;">✅</th>
              <th style="padding: 10px; text-align: center;">❌</th>
              <th style="padding: 10px; text-align: right;">Items</th>
              <th style="padding: 10px; text-align: right;">Avg Time</th>
            </tr>
            ${cronjobTableRows || '<tr><td colspan="6" style="padding: 8px; text-align: center;">Geen cronjobs uitgevoerd</td></tr>'}
          </table>
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📀 Discogs Import Queue</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Status</th>
              <th style="padding: 10px; text-align: right;">Aantal</th>
            </tr>
            <tr><td style="padding: 8px;">⏳ Pending</td><td style="padding: 8px; text-align: right;">${discogsStats?.pending || 0}</td></tr>
            <tr><td style="padding: 8px;">🔄 Processing</td><td style="padding: 8px; text-align: right;">${discogsStats?.processing || 0}</td></tr>
            <tr><td style="padding: 8px;">✅ Completed</td><td style="padding: 8px; text-align: right; color: green;">${discogsStats?.completed || 0}</td></tr>
            <tr><td style="padding: 8px;">❌ Failed</td><td style="padding: 8px; text-align: right; color: ${(discogsStats?.failed || 0) > 0 ? 'red' : 'inherit'};">${discogsStats?.failed || 0}</td></tr>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>
              <a href="https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar" style="color: #667eea;">Open Supabase Dashboard</a> |
              <a href="https://www.musicscan.app/admin" style="color: #667eea;">Open Admin Panel</a>
            </p>
            <p>Report gegenereerd op ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: 'MusicScan Reports <onboarding@resend.dev>',
        to: [REPORT_EMAIL],
        subject: `${hasIssues ? '⚠️' : '✅'} MusicScan Status Report - ${reportTime}`,
        html: emailHtml,
      });
      
      console.log('📧 Status report email sent successfully');
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured');
    }

    // Log execution
    await supabase
      .from('cronjob_execution_log')
      .insert({
        function_name: 'daily-status-report',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        metadata: {
          period_start: periodStart,
          period_end: periodEnd,
          cronjob_runs: (cronjobStats || []).length,
          new_blogs: newBlogs,
          new_music_stories: newMusicStories,
          singles_processed: singlesProcessedPeriod,
          has_issues: hasIssues
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Status report sent',
      period: { start: periodStart, end: periodEnd },
      hasIssues
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Status report error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
