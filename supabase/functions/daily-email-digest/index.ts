import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyDigestData {
  news: any[];
  releases: any[];
  blogs: any[];
  uploads: number;
  newUsers: number;
}

interface EmailRecipient {
  user_id: string;
  first_name: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Check for required environment variables
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable is not set');
  throw new Error('RESEND_API_KEY is required but not found in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

async function collectDailyData(): Promise<DailyDigestData> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  console.log('Collecting daily digest data...');

  // Get latest news from cache
  const { data: newsData } = await supabase
    .from('news_cache')
    .select('content')
    .order('cached_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let news = [];
  if (newsData?.content && Array.isArray(newsData.content)) {
    news = newsData.content.slice(0, 3); // Top 3 news items
  }

  // Get latest releases from news_blog_posts (music news)
  const { data: releasesData } = await supabase
    .from('news_blog_posts')
    .select('title, summary, slug, image_url, published_at')
    .gte('published_at', yesterdayISO)
    .order('published_at', { ascending: false })
    .limit(5);

  // Get recent blog posts 
  const { data: blogsData } = await supabase
    .from('blog_posts')
    .select('id, album_id, slug, yaml_frontmatter, album_cover_url, created_at')
    .eq('is_published', true)
    .gte('created_at', yesterdayISO)
    .order('created_at', { ascending: false })
    .limit(5);

  // Count new uploads (CD + Vinyl scans)
  const { count: cdUploads } = await supabase
    .from('cd_scan')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayISO);

  const { count: vinylUploads } = await supabase
    .from('vinyl2_scan')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayISO);

  // Count new users
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgoISO);

  return {
    news: news || [],
    releases: releasesData || [],
    blogs: blogsData || [],
    uploads: (cdUploads || 0) + (vinylUploads || 0),
    newUsers: newUsers || 0
  };
}

function generateEmailHTML(firstName: string, data: DailyDigestData, userId: string): string {
  const unsubscribeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/daily-email-digest?action=unsubscribe&user_id=${userId}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicScan - Dagelijkse Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; }
    .content { padding: 24px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .news-item, .blog-item { margin-bottom: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea; }
    .news-title, .blog-title { font-weight: 600; margin-bottom: 8px; color: #1f2937; }
    .news-summary { color: #6b7280; font-size: 14px; line-height: 1.5; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .stat-item { text-align: center; padding: 16px; background-color: #f0f4ff; border-radius: 8px; }
    .stat-number { font-size: 24px; font-weight: 700; color: #667eea; }
    .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .cta { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; }
    .unsubscribe { color: #9ca3af; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 MusicScan Dagelijkse Update</h1>
      <p>Hallo ${firstName}! Hier is wat er vandaag gebeurt in de muziekwereld.</p>
    </div>
    
    <div class="content">
      ${data.news.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🎵 Muzieknieuws</h2>
        ${data.news.map(item => `
          <div class="news-item">
            <div class="news-title">${item.title || 'Nieuw Muzieknieuws'}</div>
            <div class="news-summary">${item.summary || item.content || 'Interessant muzieuws van vandaag'}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.releases.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🆕 Nieuwe Releases</h2>
        ${data.releases.map(release => `
          <div class="news-item">
            <div class="news-title">${release.title}</div>
            <div class="news-summary">${release.summary}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.blogs.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📝 Nieuwe Community Blogs</h2>
        ${data.blogs.map(blog => {
          const frontmatter = blog.yaml_frontmatter || {};
          return `
            <div class="blog-item">
              <div class="blog-title">${frontmatter.title || 'Nieuwe Blog Post'}</div>
              <div class="news-summary">Door een community member - ${frontmatter.artist || 'Onbekende artiest'}</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">📊 Community Activiteit</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${data.uploads}</div>
            <div class="stat-label">Nieuwe Uploads</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${data.newUsers}</div>
            <div class="stat-label">Nieuwe Gebruikers</div>
          </div>
        </div>
      </div>

      <div class="cta">
        <a href="https://musicscan.ai" class="cta-button">Bekijk MusicScan App</a>
      </div>
    </div>

    <div class="footer">
      <p>Je ontvangt deze email omdat je ingeschreven bent voor dagelijkse updates van MusicScan.</p>
      <p><a href="${unsubscribeUrl}" class="unsubscribe">Uitschrijven</a> | MusicScan Team</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendDigestEmails(data: DailyDigestData, testUserId?: string, testEmail?: string) {
  console.log('Fetching users who want email notifications...');
  
  let query = supabase
    .from('profiles')
    .select('user_id, first_name')
    .eq('email_notifications', true);

  // Filter to specific user if test parameter provided
  if (testUserId) {
    query = query.eq('user_id', testUserId);
    console.log(`🧪 Test mode: filtering to user ${testUserId}`);
  }

  const { data: recipients, error } = await query;

  if (error) {
    console.error('Error fetching recipients:', error);
    return { success: false, error: error.message };
  }

  if (!recipients || recipients.length === 0) {
    console.log('No recipients found for daily digest');
    return { success: true, sent: 0, message: 'No recipients found' };
  }

  console.log(`Found ${recipients.length} recipients for daily digest`);

  // Get user emails from auth.users (this requires service role key)
  const userIds = recipients.map(r => r.user_id);
  
  let sentCount = 0;
  let errors = [];

  for (const recipient of recipients) {
    try {
      let emailAddress = testEmail;
      
      if (!testEmail) {
        // Get user email from auth metadata
        const { data: authUser } = await supabase.auth.admin.getUserById(recipient.user_id);
        
        if (!authUser.user?.email) {
          console.log(`No email found for user ${recipient.user_id}`);
          continue;
        }
        emailAddress = authUser.user.email;
      }

      const emailHTML = generateEmailHTML(
        recipient.first_name || 'Muziekliefhebber', 
        data, 
        recipient.user_id
      );

      console.log(`📧 Sending email to ${emailAddress}...`);

      const { data: emailResult, error: emailError } = await resend.emails.send({
        // Using verified sender temporarily - switch to 'MusicScan <dagelijks@musicscan.ai>' when domain is verified
        from: 'MusicScan <onboarding@resend.dev>',
        to: [emailAddress],
        subject: `🎵 Je dagelijkse muziekupdate - ${new Date().toLocaleDateString('nl-NL')}`,
        html: emailHTML,
      });

      if (emailError) {
        console.error(`❌ Failed to send email to ${emailAddress}:`, emailError);
        errors.push({ user_id: recipient.user_id, error: emailError.message });
      } else {
        sentCount++;
        console.log(`✅ Email sent successfully to ${emailAddress}`, emailResult ? `(ID: ${emailResult.id})` : '');
      }

      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error processing recipient ${recipient.user_id}:`, error);
      errors.push({ user_id: recipient.user_id, error: error.message });
    }
  }

  return {
    success: true,
    sent: sentCount,
    total: recipients.length,
    errors: errors
  };
}

async function handleUnsubscribe(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications: false })
    .eq('user_id', userId);

  if (error) {
    console.error('Error unsubscribing user:', error);
    return new Response('Error processing unsubscribe request', { status: 500 });
  }

  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Uitgeschreven</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; padding: 20px;">
      <h1>✅ Je bent uitgeschreven</h1>
      <p>Je ontvangt geen dagelijkse email updates meer van MusicScan.</p>
      <p>Je kunt deze instelling altijd wijzigen in je profiel op de app.</p>
      <a href="https://musicscan.ai" style="color: #667eea;">Terug naar MusicScan</a>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('user_id');
    const testUserId = url.searchParams.get('only_user');
    const testEmail = url.searchParams.get('test_email');

    // Handle unsubscribe requests
    if (action === 'unsubscribe' && userId) {
      return await handleUnsubscribe(userId);
    }

    // Main digest sending logic
    console.log('🚀 Starting daily email digest process...');
    
    if (testUserId) {
      console.log(`🧪 Test mode enabled: sending only to user ${testUserId}`);
    } else if (testEmail) {
      console.log(`🧪 Test mode enabled: sending only to email ${testEmail}`);
    } else {
      console.log('📧 Normal mode: sending to all subscribed users');
    }
    
    const data = await collectDailyData();
    console.log('Collected data:', {
      news: data.news.length,
      releases: data.releases.length,
      blogs: data.blogs.length,
      uploads: data.uploads,
      newUsers: data.newUsers
    });

    const result = await sendDigestEmails(data, testUserId || undefined, testEmail || undefined);
    
    console.log('✅ Daily digest process completed:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily digest emails sent successfully',
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in daily digest process:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});