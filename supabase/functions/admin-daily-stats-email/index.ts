import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AnalyticsStats {
  total_hits: number;
  real_users: number;
  datacenter_hits: number;
  purity_score: number;
  avg_real_score: number;
  unique_sessions: number;
  pages_per_session: number;
}

interface CountryStats {
  country: string;
  hit_count: number;
  real_users: number;
}

interface SourceStats {
  source: string;
  hit_count: number;
  percentage: number;
}

interface DeviceStats {
  device_type: string;
  count: number;
  percentage: number;
}

interface HourlyStats {
  hour: number;
  count: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface ScanStats {
  ai_scans: number;
  cd_scans: number;
  vinyl_scans: number;
  total: number;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatPercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '↑ nieuw' : '—';
  const change = ((current - previous) / previous) * 100;
  if (change > 0) return `↑ ${change.toFixed(0)}%`;
  if (change < 0) return `↓ ${Math.abs(change).toFixed(0)}%`;
  return '—';
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Germany': '🇩🇪',
    'United States': '🇺🇸', 'France': '🇫🇷', 'United Kingdom': '🇬🇧',
    'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  };
  return flags[country] || '🌍';
}

function prettifyPath(path: string): string {
  if (path === '/') return 'Homepage';
  return path.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' › ').slice(0, 50);
}

function generateEmailHtml(
  date: string,
  stats: AnalyticsStats,
  prevStats: AnalyticsStats,
  countries: CountryStats[],
  sources: SourceStats[],
  devices: DeviceStats[],
  peakHour: HourlyStats | null,
  scans: ScanStats,
  prevScans: ScanStats,
  topPages: TopPage[],
  newUsers: number,
  newBlogPosts: number,
  newOrders: number,
): string {
  const sessionsChange = formatPercentageChange(stats.unique_sessions, prevStats.unique_sessions);
  const pageviewsChange = formatPercentageChange(stats.real_users, prevStats.real_users);
  const datacenterChange = formatPercentageChange(stats.datacenter_hits, prevStats.datacenter_hits);
  const scansChange = formatPercentageChange(scans.total, prevScans.total);

  const countriesHtml = countries.slice(0, 5).map(c => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${getCountryFlag(c.country)} ${c.country}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${c.real_users}</td>
    </tr>
  `).join('');

  const sourcesHtml = sources.slice(0, 5).map(s => {
    const barWidth = Math.min(s.percentage, 100);
    return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${s.source || 'Direct'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; width: 120px;">
        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%;">
          <div style="background: linear-gradient(90deg, #8B5CF6, #F59E0B); border-radius: 4px; height: 8px; width: ${barWidth}%;"></div>
        </div>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${s.percentage.toFixed(0)}%</td>
    </tr>
  `;
  }).join('');

  const devicesHtml = devices.map(d => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${d.device_type === 'desktop' ? '💻' : d.device_type === 'mobile' ? '📱' : '📟'} ${d.device_type}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${d.percentage.toFixed(0)}%</td>
    </tr>
  `).join('');

  const topPagesHtml = topPages.slice(0, 10).map((p, i) => `
    <tr>
      <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #666;">${i + 1}.</td>
      <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${prettifyPath(p.path)}</td>
      <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${p.views}</td>
    </tr>
  `).join('');

  const peakHourText = peakHour ? `${peakHour.hour.toString().padStart(2, '0')}:00 - ${(peakHour.hour + 1).toString().padStart(2, '0')}:00 (${peakHour.count} sessies)` : 'Geen data';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicScan Dagelijkse Statistieken</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎵 MusicScan</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Dagelijks Rapport</p>
              <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${date}</p>
            </td>
          </tr>

          <!-- Quick Summary Bar -->
          <tr>
            <td style="padding: 20px 30px; background: #1a1a2e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="text-align: center;">
                    <div style="font-size: 22px; font-weight: 700; color: #8B5CF6;">${stats.unique_sessions}</div>
                    <div style="font-size: 11px; color: #aaa;">Bezoekers</div>
                  </td>
                  <td width="25%" style="text-align: center;">
                    <div style="font-size: 22px; font-weight: 700; color: #F59E0B;">${scans.total}</div>
                    <div style="font-size: 11px; color: #aaa;">Scans</div>
                  </td>
                  <td width="25%" style="text-align: center;">
                    <div style="font-size: 22px; font-weight: 700; color: #22c55e;">${newUsers}</div>
                    <div style="font-size: 11px; color: #aaa;">Nieuwe Users</div>
                  </td>
                  <td width="25%" style="text-align: center;">
                    <div style="font-size: 22px; font-weight: 700; color: #ef4444;">${newOrders}</div>
                    <div style="font-size: 11px; color: #aaa;">Bestellingen</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Stats -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">📊 Bezoekersoverzicht</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #f8f4ff; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #8B5CF6;">${stats.unique_sessions.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Unieke Sessies</div>
                      <div style="font-size: 11px; color: ${sessionsChange.startsWith('↑') ? '#22c55e' : sessionsChange.startsWith('↓') ? '#ef4444' : '#666'}; margin-top: 2px;">${sessionsChange}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">${stats.real_users.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Echte Pageviews</div>
                      <div style="font-size: 11px; color: ${pageviewsChange.startsWith('↑') ? '#22c55e' : pageviewsChange.startsWith('↓') ? '#ef4444' : '#666'}; margin-top: 2px;">${pageviewsChange}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #22c55e;">${stats.purity_score.toFixed(0)}%</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Purity Score</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${stats.datacenter_hits.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Bot/Datacenter Hits</div>
                      <div style="font-size: 11px; color: ${datacenterChange.startsWith('↓') ? '#22c55e' : datacenterChange.startsWith('↑') ? '#ef4444' : '#666'}; margin-top: 2px;">${datacenterChange}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 15px 0 0 0; font-size: 13px; color: #666; text-align: center;">
                📄 ${stats.pages_per_session.toFixed(1)} pagina's per sessie &nbsp;|&nbsp; ⏰ Piekuur: ${peakHourText}
              </p>
            </td>
          </tr>

          <!-- Scans Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">🔍 Scans Overzicht</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 5px;">
                    <div style="background: #f8f4ff; border-radius: 8px; padding: 12px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #8B5CF6;">${scans.ai_scans}</div>
                      <div style="font-size: 11px; color: #666;">AI Scans</div>
                    </div>
                  </td>
                  <td width="33%" style="padding: 5px;">
                    <div style="background: #fff7ed; border-radius: 8px; padding: 12px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #F59E0B;">${scans.cd_scans}</div>
                      <div style="font-size: 11px; color: #666;">CD Scans</div>
                    </div>
                  </td>
                  <td width="33%" style="padding: 5px;">
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #22c55e;">${scans.vinyl_scans}</div>
                      <div style="font-size: 11px; color: #666;">Vinyl Scans</div>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #888; text-align: center;">
                Totaal: ${scans.total} scans ${scansChange !== '—' ? `(${scansChange} t.o.v. gisteren)` : ''}
              </p>
            </td>
          </tr>

          <!-- Top Pages -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">🏆 Top 10 Pagina's</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9f9f9;">
                    <th style="padding: 8px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666; width: 30px;">#</th>
                    <th style="padding: 8px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666;">Pagina</th>
                    <th style="padding: 8px 12px; text-align: right; font-weight: 600; font-size: 12px; color: #666;">Views</th>
                  </tr>
                </thead>
                <tbody>
                  ${topPagesHtml || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #999;">Geen data</td></tr>'}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Traffic Sources -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">📍 Traffic Bronnen</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9f9f9;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666;">Bron</th>
                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666;"></th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px; color: #666;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${sourcesHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Countries & Devices -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 10px; vertical-align: top;">
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">🌍 Top Landen</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                      <tbody>
                        ${countriesHtml}
                      </tbody>
                    </table>
                  </td>
                  <td width="50%" style="padding-left: 10px; vertical-align: top;">
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">📱 Devices</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                      <tbody>
                        ${devicesHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Stats -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">📝 Content & Conversies</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 5px;">
                    <div style="background: #f8f4ff; border-radius: 8px; padding: 12px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #8B5CF6;">${newBlogPosts}</div>
                      <div style="font-size: 11px; color: #666;">Nieuwe Verhalen</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 5px;">
                    <div style="background: #fff7ed; border-radius: 8px; padding: 12px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #F59E0B;">${newOrders}</div>
                      <div style="font-size: 11px; color: #666;">Bestellingen</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <a href="https://www.musicscan.app/admin/statistics" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Bekijk Volledig Dashboard →
              </a>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
                Deze email wordt dagelijks om 08:00 verzonden.<br>
                © ${new Date().getFullYear()} MusicScan
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate yesterday's date range
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const yesterdayStart = yesterday.toISOString().split('T')[0];
    const yesterdayEnd = yesterday.toISOString().split('T')[0];
    const dayBeforeStart = dayBefore.toISOString().split('T')[0];
    const dayBeforeEnd = dayBefore.toISOString().split('T')[0];

    const yesterdayISO = yesterday.toISOString();
    const todayISO = now.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const dayBeforeISO = dayBefore.toISOString();

    console.log(`📊 Fetching stats for: ${yesterdayStart} (comparing to ${dayBeforeStart})`);

    // Parallel fetch all data
    const [
      statsResult,
      prevStatsResult,
      countriesResult,
      sourcesResult,
      devicesResult,
      hourlyResult,
      aiScansResult,
      cdScansResult,
      vinylScansResult,
      prevAiScansResult,
      prevCdScansResult,
      prevVinylScansResult,
      topPagesResult,
      newUsersResult,
      newBlogPostsResult,
      newOrdersResult,
    ] = await Promise.all([
      supabase.rpc('get_clean_analytics_stats', { p_start_date: yesterdayStart, p_end_date: yesterdayEnd }),
      supabase.rpc('get_clean_analytics_stats', { p_start_date: dayBeforeStart, p_end_date: dayBeforeEnd }),
      supabase.rpc('get_clean_analytics_countries', { p_start_date: yesterdayStart, p_end_date: yesterdayEnd }),
      supabase.rpc('get_clean_analytics_sources', { p_start_date: yesterdayStart, p_end_date: yesterdayEnd }),
      supabase.rpc('get_clean_analytics_devices', { p_start_date: yesterdayStart, p_end_date: yesterdayEnd }),
      supabase.rpc('get_clean_analytics_hourly', { p_start_date: yesterdayStart, p_end_date: yesterdayEnd }),
      // Scans yesterday
      supabase.from('ai_scan_results').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
      supabase.from('cd_scan').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
      supabase.from('vinyl2_scan').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
      // Scans day before
      supabase.from('ai_scan_results').select('id', { count: 'exact', head: true }).gte('created_at', dayBeforeISO).lt('created_at', yesterdayISO),
      supabase.from('cd_scan').select('id', { count: 'exact', head: true }).gte('created_at', dayBeforeISO).lt('created_at', yesterdayISO),
      supabase.from('vinyl2_scan').select('id', { count: 'exact', head: true }).gte('created_at', dayBeforeISO).lt('created_at', yesterdayISO),
      // Top pages from clean_analytics
      supabase.from('clean_analytics').select('path').gte('created_at', yesterdayISO).lt('created_at', todayISO).eq('is_datacenter', false).not('path', 'is', null),
      // New users
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
      // New blog posts
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
      // Orders
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO),
    ]);

    // Process stats - RPC may return array or single object
    const defaultStats = {
      total_hits: 0, real_users: 0, datacenter_hits: 0, purity_score: 0,
      avg_real_score: 0, unique_sessions: 0, pages_per_session: 0
    };
    const rawStats = statsResult.data;
    const stats: AnalyticsStats = (Array.isArray(rawStats) ? rawStats[0] : rawStats) || defaultStats;
    const rawPrev = prevStatsResult.data;
    const prevStats: AnalyticsStats = (Array.isArray(rawPrev) ? rawPrev[0] : rawPrev) || defaultStats;

    const countries: CountryStats[] = countriesResult.data || [];
    const sources: SourceStats[] = sourcesResult.data || [];
    const devices: DeviceStats[] = devicesResult.data || [];

    const peakHour: HourlyStats | null = hourlyResult.data?.length > 0
      ? hourlyResult.data.reduce((max: HourlyStats, h: HourlyStats) => h.count > max.count ? h : max, hourlyResult.data[0])
      : null;

    // Scans
    const scans: ScanStats = {
      ai_scans: aiScansResult.count || 0,
      cd_scans: cdScansResult.count || 0,
      vinyl_scans: vinylScansResult.count || 0,
      total: (aiScansResult.count || 0) + (cdScansResult.count || 0) + (vinylScansResult.count || 0),
    };
    const prevScans: ScanStats = {
      ai_scans: prevAiScansResult.count || 0,
      cd_scans: prevCdScansResult.count || 0,
      vinyl_scans: prevVinylScansResult.count || 0,
      total: (prevAiScansResult.count || 0) + (prevCdScansResult.count || 0) + (prevVinylScansResult.count || 0),
    };

    // Top pages - aggregate from raw data
    const pathCounts: Record<string, number> = {};
    if (topPagesResult.data) {
      for (const row of topPagesResult.data) {
        if (row.path) {
          pathCounts[row.path] = (pathCounts[row.path] || 0) + 1;
        }
      }
    }
    const topPages: TopPage[] = Object.entries(pathCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const newUsers = newUsersResult.count || 0;
    const newBlogPosts = newBlogPostsResult.count || 0;
    const newOrders = newOrdersResult.count || 0;

    console.log(`📊 Stats: ${stats.unique_sessions} sessions, ${scans.total} scans, ${topPages.length} pages tracked`);

    // Generate email HTML
    const dateStr = formatDate(yesterday);
    const emailHtml = generateEmailHtml(dateStr, stats, prevStats, countries, sources, devices, peakHour, scans, prevScans, topPages, newUsers, newBlogPosts, newOrders);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "MusicScan <noreply@musicscan.nl>",
      to: [adminEmail],
      subject: `📊 MusicScan Rapport - ${dateStr}`,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily stats email sent to ${adminEmail}`,
        stats: {
          date: yesterdayStart,
          sessions: stats.unique_sessions,
          pageviews: stats.real_users,
          scans: scans.total,
          topPages: topPages.length,
          newUsers,
          newOrders,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("❌ Error sending daily stats email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
