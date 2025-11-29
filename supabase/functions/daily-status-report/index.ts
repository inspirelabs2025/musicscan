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

    console.log('📊 Generating comprehensive daily status report...');

    // Determine report period (last 8 hours for twice daily reports)
    const periodStart = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();
    const reportTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // ============================================
    // 1. CRONJOB EXECUTION STATS
    // ============================================
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

    // ============================================
    // 2. SINGLES IMPORT QUEUE
    // ============================================
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

    const { count: singlesProcessedPeriod } = await supabase
      .from('singles_import_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'failed'])
      .gte('processed_at', periodStart);

    // ============================================
    // 3. BATCH QUEUE STATUS
    // ============================================
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

    // ============================================
    // 4. CONTENT CREATION STATS
    // ============================================
    const { count: newBlogs } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: newMusicStories } = await supabase
      .from('music_stories')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: newArtistStories } = await supabase
      .from('artist_stories')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    // ============================================
    // 5. NEWS STATS
    // ============================================
    const { count: newNewsArticles } = await supabase
      .from('news_blog_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: totalNewsArticles } = await supabase
      .from('news_blog_posts')
      .select('*', { count: 'exact', head: true });

    // News cache by source
    const { data: newsCacheData } = await supabase
      .from('news_cache')
      .select('source, cached_at, expires_at');

    const newsCacheSummary: Record<string, { lastCached: string; isExpired: boolean }> = {};
    for (const item of newsCacheData || []) {
      const isExpired = new Date(item.expires_at) < new Date();
      newsCacheSummary[item.source] = {
        lastCached: new Date(item.cached_at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
        isExpired
      };
    }

    // News generation logs
    const { data: newsGenerationLogs } = await supabase
      .from('news_generation_logs')
      .select('source, status, items_generated, error_message, created_at')
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    const newsGenSummary: Record<string, { runs: number; success: number; items: number; lastError?: string }> = {};
    for (const log of newsGenerationLogs || []) {
      if (!newsGenSummary[log.source]) {
        newsGenSummary[log.source] = { runs: 0, success: 0, items: 0 };
      }
      newsGenSummary[log.source].runs++;
      if (log.status === 'success' || log.status === 'completed') {
        newsGenSummary[log.source].success++;
        newsGenSummary[log.source].items += log.items_generated || 0;
      } else if (log.error_message) {
        newsGenSummary[log.source].lastError = log.error_message;
      }
    }

    // ============================================
    // 6. ANECDOTES STATS
    // ============================================
    const { count: newAnecdotes } = await supabase
      .from('music_anecdotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: totalAnecdotes } = await supabase
      .from('music_anecdotes')
      .select('*', { count: 'exact', head: true });

    // ============================================
    // 7. MUSIC HISTORY EVENTS
    // ============================================
    const { count: newMusicHistory } = await supabase
      .from('music_history_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: totalMusicHistory } = await supabase
      .from('music_history_events')
      .select('*', { count: 'exact', head: true });

    // ============================================
    // 8. YOUTUBE DISCOVERIES
    // ============================================
    const { count: newYouTube } = await supabase
      .from('youtube_discoveries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: totalYouTube } = await supabase
      .from('youtube_discoveries')
      .select('*', { count: 'exact', head: true });

    // ============================================
    // 9. SPOTIFY RELEASES
    // ============================================
    const { count: newSpotifyReleases } = await supabase
      .from('spotify_new_releases_processed')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: totalSpotifyReleases } = await supabase
      .from('spotify_new_releases_processed')
      .select('*', { count: 'exact', head: true });

    // ============================================
    // 10. INDEXNOW SUBMISSIONS
    // ============================================
    const { count: indexNowSubmitted } = await supabase
      .from('indexnow_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', periodStart);

    // ============================================
    // 11. DISCOGS IMPORT STATUS
    // ============================================
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

    const { count: discogsProcessedPeriod } = await supabase
      .from('discogs_import_log')
      .select('*', { count: 'exact', head: true })
      .gte('processed_at', periodStart);

    // ============================================
    // CHECK EXPECTED DAILY PROCESSES
    // ============================================
    const expectedDailyProcesses = [
      { name: 'daily-anecdote-generator', label: 'Anekdote Generator', expectedRuns: 1 },
      { name: 'generate-daily-music-history', label: 'Muziekgeschiedenis', expectedRuns: 1 },
      { name: 'rss-news-rewriter', label: 'RSS Nieuws', expectedRuns: 2 },
      { name: 'process-spotify-new-releases', label: 'Spotify Releases', expectedRuns: 2 },
      { name: 'singles-batch-processor', label: 'Singles Processor', expectedRuns: 24 },
      { name: 'artist-stories-batch-processor', label: 'Artist Stories', expectedRuns: 4 },
      { name: 'batch-blog-processor', label: 'Blog Processor', expectedRuns: 12 },
      { name: 'discogs-lp-crawler', label: 'Discogs LP Crawler', expectedRuns: 6 },
      { name: 'latest-discogs-news', label: 'Discogs News', expectedRuns: 8 },
      { name: 'indexnow-cron', label: 'IndexNow', expectedRuns: 6 },
      { name: 'refresh-featured-photos', label: 'Featured Photos', expectedRuns: 2 },
      { name: 'generate-curated-artists', label: 'Curated Artists', expectedRuns: 1 },
    ];

    const processStatus = expectedDailyProcesses.map(proc => {
      const stats = cronjobSummary[proc.name];
      const actualRuns = stats?.runs || 0;
      // For 8-hour period, expect 1/3 of daily runs
      const expectedInPeriod = Math.ceil(proc.expectedRuns / 3);
      const status = actualRuns >= expectedInPeriod ? '✅' : actualRuns > 0 ? '⚠️' : '❌';
      return {
        ...proc,
        actualRuns,
        expectedInPeriod,
        status,
        successful: stats?.successful || 0,
        failed: stats?.failed || 0,
        items: stats?.itemsProcessed || 0
      };
    });

    // ============================================
    // BUILD HTML EMAIL
    // ============================================
    const cronjobTableRows = Object.entries(cronjobSummary)
      .sort((a, b) => b[1].runs - a[1].runs)
      .map(([name, stats]) => `
        <tr style="${stats.failed > 0 ? 'background-color: #ffebee;' : ''}">
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${name}</td>
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

    const processStatusRows = processStatus.map(proc => `
      <tr style="${proc.status === '❌' ? 'background-color: #ffebee;' : proc.status === '⚠️' ? 'background-color: #fff3e0;' : ''}">
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${proc.status}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${proc.label}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${proc.actualRuns}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${proc.expectedInPeriod}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: green;">${proc.successful}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: ${proc.failed > 0 ? 'red' : 'inherit'};">${proc.failed}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${proc.items}</td>
      </tr>
    `).join('');

    const newsGenRows = Object.entries(newsGenSummary).map(([source, stats]) => `
      <tr style="${stats.lastError ? 'background-color: #ffebee;' : ''}">
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${source}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${stats.runs}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: green;">${stats.success}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${stats.items}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; color: red;">${stats.lastError || '-'}</td>
      </tr>
    `).join('');

    const newsCacheRows = Object.entries(newsCacheSummary).map(([source, info]) => `
      <tr style="${info.isExpired ? 'background-color: #fff3e0;' : ''}">
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${source}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${info.lastCached}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${info.isExpired ? '⚠️ Verlopen' : '✅ Actief'}</td>
      </tr>
    `).join('');

    const hasIssues = Object.values(cronjobSummary).some(s => s.failed > 0) || 
                      (singlesStats?.failed || 0) > 0 ||
                      processStatus.some(p => p.status === '❌');

    const missedProcesses = processStatus.filter(p => p.status === '❌');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MusicScan Status Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📊 MusicScan Compleet Status Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportTime}</p>
          <p style="margin: 5px 0 0 0; opacity: 0.7; font-size: 14px;">Periode: laatste 8 uur</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
          ${hasIssues ? `
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
              <strong>⚠️ Er zijn problemen gedetecteerd!</strong>
              ${missedProcesses.length > 0 ? `<br><span style="font-size: 13px;">Gemiste processen: ${missedProcesses.map(p => p.label).join(', ')}</span>` : ''}
            </div>
          ` : `
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px;">
              <strong>✅ Alles draait soepel!</strong> Alle processen draaien volgens verwachting.
            </div>
          `}
          
          <!-- SUMMARY CARDS -->
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📈 Samenvatting</h2>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${newBlogs || 0}</div>
              <div style="color: #666; font-size: 12px;">Nieuwe Blogs</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${newMusicStories || 0}</div>
              <div style="color: #666; font-size: 12px;">Music Stories</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${newArtistStories || 0}</div>
              <div style="color: #666; font-size: 12px;">Artist Stories</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #e91e63;">${newNewsArticles || 0}</div>
              <div style="color: #666; font-size: 12px;">Nieuws Artikelen</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #ff9800;">${newAnecdotes || 0}</div>
              <div style="color: #666; font-size: 12px;">Anekdotes</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #9c27b0;">${newMusicHistory || 0}</div>
              <div style="color: #666; font-size: 12px;">Muziekgeschiedenis</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #f44336;">${newYouTube || 0}</div>
              <div style="color: #666; font-size: 12px;">YouTube Videos</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #1db954;">${newSpotifyReleases || 0}</div>
              <div style="color: #666; font-size: 12px;">Spotify Releases</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${singlesProcessedPeriod || 0}</div>
              <div style="color: #666; font-size: 12px;">Singles Verwerkt</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${discogsProcessedPeriod || 0}</div>
              <div style="color: #666; font-size: 12px;">Discogs Imports</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${indexNowSubmitted || 0}</div>
              <div style="color: #666; font-size: 12px;">IndexNow</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 22px; font-weight: bold; color: #667eea;">${(cronjobStats || []).length}</div>
              <div style="color: #666; font-size: 12px;">Cronjob Runs</div>
            </div>
          </div>

          <!-- TOTALS -->
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">📊 Database Totalen</h3>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; font-size: 12px;">
              <div><strong>${totalNewsArticles || 0}</strong> Nieuws</div>
              <div><strong>${totalAnecdotes || 0}</strong> Anekdotes</div>
              <div><strong>${totalMusicHistory || 0}</strong> Muziekgeschiedenis</div>
              <div><strong>${totalYouTube || 0}</strong> YouTube</div>
              <div><strong>${totalSpotifyReleases || 0}</strong> Spotify</div>
            </div>
          </div>

          <!-- PROCESS STATUS TABLE -->
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🔄 Proces Status Overzicht</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; font-size: 12px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; width: 30px;">Status</th>
              <th style="padding: 8px; text-align: left;">Proces</th>
              <th style="padding: 8px; text-align: center;">Runs</th>
              <th style="padding: 8px; text-align: center;">Verwacht</th>
              <th style="padding: 8px; text-align: center;">✅</th>
              <th style="padding: 8px; text-align: center;">❌</th>
              <th style="padding: 8px; text-align: right;">Items</th>
            </tr>
            ${processStatusRows}
          </table>

          <!-- NEWS SECTION -->
          <h2 style="color: #e91e63; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">📰 Nieuws Generatie</h2>
          
          ${Object.keys(newsGenSummary).length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 15px; font-size: 12px;">
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left;">Bron</th>
                <th style="padding: 8px; text-align: center;">Runs</th>
                <th style="padding: 8px; text-align: center;">Succes</th>
                <th style="padding: 8px; text-align: right;">Items</th>
                <th style="padding: 8px; text-align: left;">Error</th>
              </tr>
              ${newsGenRows}
            </table>
          ` : '<p style="color: #666; font-size: 13px;">Geen nieuws generatie in deze periode</p>'}

          <h3 style="font-size: 14px; color: #666;">📦 News Cache Status</h3>
          ${Object.keys(newsCacheSummary).length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; font-size: 12px;">
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left;">Bron</th>
                <th style="padding: 8px; text-align: left;">Laatst Gecached</th>
                <th style="padding: 8px; text-align: center;">Status</th>
              </tr>
              ${newsCacheRows}
            </table>
          ` : '<p style="color: #666; font-size: 13px;">Geen cache data beschikbaar</p>'}

          <!-- SINGLES QUEUE -->
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
          
          <!-- BATCH QUEUES -->
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
          
          <!-- CRONJOB DETAILS -->
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">⏰ Alle Cronjob Executions</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; font-size: 11px;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Function</th>
              <th style="padding: 8px; text-align: center;">Runs</th>
              <th style="padding: 8px; text-align: center;">✅</th>
              <th style="padding: 8px; text-align: center;">❌</th>
              <th style="padding: 8px; text-align: right;">Items</th>
              <th style="padding: 8px; text-align: right;">Avg Time</th>
            </tr>
            ${cronjobTableRows || '<tr><td colspan="6" style="padding: 8px; text-align: center;">Geen cronjobs uitgevoerd</td></tr>'}
          </table>
          
          <!-- DISCOGS IMPORT -->
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
              <a href="https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/functions" style="color: #667eea;">Edge Functions</a> |
              <a href="https://www.musicscan.app/admin" style="color: #667eea;">Admin Panel</a>
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
        subject: `${hasIssues ? '⚠️' : '✅'} MusicScan Compleet Status Report - ${reportTime}`,
        html: emailHtml,
      });
      
      console.log('📧 Comprehensive status report email sent successfully');
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
          new_news_articles: newNewsArticles,
          new_anecdotes: newAnecdotes,
          new_music_history: newMusicHistory,
          new_youtube: newYouTube,
          new_spotify: newSpotifyReleases,
          singles_processed: singlesProcessedPeriod,
          has_issues: hasIssues,
          missed_processes: missedProcesses.map(p => p.name)
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Comprehensive status report sent',
      period: { start: periodStart, end: periodEnd },
      summary: {
        blogs: newBlogs,
        musicStories: newMusicStories,
        artistStories: newArtistStories,
        news: newNewsArticles,
        anecdotes: newAnecdotes,
        musicHistory: newMusicHistory,
        youtube: newYouTube,
        spotify: newSpotifyReleases,
        singles: singlesProcessedPeriod,
        cronjobs: (cronjobStats || []).length
      },
      hasIssues,
      missedProcesses: missedProcesses.map(p => p.name)
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
