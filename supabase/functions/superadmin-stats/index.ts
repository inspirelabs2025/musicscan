import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Superadmin stats function called');

    // Get the user's email from the Authorization header
    const authHeader = req.headers.get('authorization');
    
    // Create regular client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user authentication and email
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is authorized superadmin
    if (user.email !== 'rogiervisser76@gmail.com') {
      console.error('❌ Unauthorized email:', user.email);
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Authorized superadmin access for:', user.email);

    // Create service role client to bypass RLS
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Fetch all statistics using service role
    console.log('📊 Fetching comprehensive statistics...');

    // Get total users from auth.users (only accessible via service role)
    const { data: allUsers, error: usersError } = await serviceSupabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    // Get date ranges for calculations
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate user statistics
    const totalUsers = allUsers.users?.length || 0;
    const newUsersLast7Days = allUsers.users?.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length || 0;
    const newUsersLast30Days = allUsers.users?.filter(u => 
      new Date(u.created_at) >= thirtyDaysAgo
    ).length || 0;

    // Get all scan data and user activities
    const [aiScansResult, cdScansResult, vinylScansResult, batchUploadsResult, profilesResult, blogPostsResult, quizResultsResult, followsResult, shopOrdersResult] = await Promise.all([
      serviceSupabase.from('ai_scan_results').select('*'),
      serviceSupabase.from('cd_scan').select('*'),
      serviceSupabase.from('vinyl2_scan').select('*'),
      serviceSupabase.from('batch_uploads').select('*'),
      serviceSupabase.from('profiles').select('*'),
      serviceSupabase.from('blog_posts').select('*'),
      serviceSupabase.from('quiz_results').select('*'),
      serviceSupabase.from('user_follows').select('*'),
      serviceSupabase.from('shop_orders').select('*')
    ]);

    if (aiScansResult.error) throw aiScansResult.error;
    if (cdScansResult.error) throw cdScansResult.error;
    if (vinylScansResult.error) throw vinylScansResult.error;
    if (batchUploadsResult.error) throw batchUploadsResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (blogPostsResult.error) throw blogPostsResult.error;
    if (quizResultsResult.error) throw quizResultsResult.error;
    if (followsResult.error) throw followsResult.error;
    if (shopOrdersResult.error) throw shopOrdersResult.error;

    const aiScans = aiScansResult.data || [];
    const cdScans = cdScansResult.data || [];
    const vinylScans = vinylScansResult.data || [];
    const batchUploads = batchUploadsResult.data || [];
    const profiles = profilesResult.data || [];
    const blogPosts = blogPostsResult.data || [];
    const quizResults = quizResultsResult.data || [];
    const follows = followsResult.data || [];
    const shopOrders = shopOrdersResult.data || [];

    console.log('📈 Data counts:', {
      totalUsers,
      aiScans: aiScans.length,
      cdScans: cdScans.length,
      vinylScans: vinylScans.length,
      batchUploads: batchUploads.length
    });

    // Calculate scan statistics
    const totalScans = aiScans.length + cdScans.length + vinylScans.length;
    
    // AI scan statistics
    const aiScansWithPricing = aiScans.filter(scan => scan.status === 'completed').length;
    const aiScansPending = aiScans.filter(scan => scan.status === 'pending').length;
    const aiScansFailed = aiScans.filter(scan => scan.status === 'failed').length;

    // CD and Vinyl scans (they exist = completed)
    const cdScansWithPricing = cdScans.filter(scan => scan.calculated_advice_price !== null).length;
    const vinylScansWithPricing = vinylScans.filter(scan => scan.calculated_advice_price !== null).length;

    // Scans today
    const scansToday = [
      ...aiScans.filter(scan => new Date(scan.created_at) >= todayStart),
      ...cdScans.filter(scan => new Date(scan.created_at) >= todayStart),
      ...vinylScans.filter(scan => new Date(scan.created_at) >= todayStart)
    ].length;

    // Top artists calculation
    const allArtists = [
      ...aiScans.filter(scan => scan.artist).map(scan => ({ artist: scan.artist, user_id: scan.user_id })),
      ...cdScans.filter(scan => scan.artist).map(scan => ({ artist: scan.artist, user_id: scan.user_id })),
      ...vinylScans.filter(scan => scan.artist).map(scan => ({ artist: scan.artist, user_id: scan.user_id }))
    ];

    const artistCounts = allArtists.reduce((acc, { artist }) => {
      acc[artist] = (acc[artist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topArtists = Object.entries(artistCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 12)
      .map(([artist, count]) => ({ artist, count }));

    // Top users calculation
    const userScansCount = allArtists.reduce((acc, { user_id }) => {
      acc[user_id] = (acc[user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsersWithScans = Object.entries(userScansCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Map user IDs to profiles/emails
    const topUsers = await Promise.all(
      topUsersWithScans.map(async ([userId, scanCount]) => {
        const profile = profiles.find(p => p.user_id === userId);
        const user = allUsers.users?.find(u => u.id === userId);
        return {
          user_id: userId,
          email: user?.email || 'Unknown',
          first_name: profile?.first_name || 'Unknown',
          scan_count: scanCount
        };
      })
    );

    // Recent activity (last 24 hours)
    const recentActivity = [
      ...aiScans.filter(scan => new Date(scan.created_at) >= new Date(now.getTime() - 24 * 60 * 60 * 1000))
        .map(scan => ({
          type: 'AI Scan',
          artist: scan.artist,
          title: scan.title,
          created_at: scan.created_at,
          user_id: scan.user_id
        })),
      ...cdScans.filter(scan => new Date(scan.created_at) >= new Date(now.getTime() - 24 * 60 * 60 * 1000))
        .map(scan => ({
          type: 'CD Scan',
          artist: scan.artist,
          title: scan.title,
          created_at: scan.created_at,
          user_id: scan.user_id
        })),
      ...vinylScans.filter(scan => new Date(scan.created_at) >= new Date(now.getTime() - 24 * 60 * 60 * 1000))
        .map(scan => ({
          type: 'Vinyl Scan',
          artist: scan.artist,
          title: scan.title,
          created_at: scan.created_at,
          user_id: scan.user_id
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

    // Comprehensive user activities (last 7 days)
    const sevenDaysAgoActivity = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const userActivities = [
      // AI Scans
      ...aiScans.filter(scan => new Date(scan.created_at) >= sevenDaysAgoActivity)
        .map(scan => {
          const user = allUsers.users?.find(u => u.id === scan.user_id);
          const profile = profiles.find(p => p.user_id === scan.user_id);
          return {
            activity_id: scan.id,
            user_id: scan.user_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'ai_scan',
            created_at: scan.created_at,
            artist: scan.artist,
            title: scan.title,
            metadata: {
              status: scan.status,
              confidence_score: scan.confidence_score,
              discogs_id: scan.discogs_id
            }
          };
        }),
      // CD Scans
      ...cdScans.filter(scan => new Date(scan.created_at) >= sevenDaysAgoActivity)
        .map(scan => {
          const user = allUsers.users?.find(u => u.id === scan.user_id);
          const profile = profiles.find(p => p.user_id === scan.user_id);
          return {
            activity_id: scan.id,
            user_id: scan.user_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'cd_scan',
            created_at: scan.created_at,
            artist: scan.artist,
            title: scan.title,
            metadata: {
              calculated_advice_price: scan.calculated_advice_price,
              condition_grade: scan.condition_grade,
              discogs_id: scan.discogs_id
            }
          };
        }),
      // Vinyl Scans
      ...vinylScans.filter(scan => new Date(scan.created_at) >= sevenDaysAgoActivity)
        .map(scan => {
          const user = allUsers.users?.find(u => u.id === scan.user_id);
          const profile = profiles.find(p => p.user_id === scan.user_id);
          return {
            activity_id: scan.id,
            user_id: scan.user_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'vinyl_scan',
            created_at: scan.created_at,
            artist: scan.artist,
            title: scan.title,
            metadata: {
              calculated_advice_price: scan.calculated_advice_price,
              condition_grade: scan.condition_grade,
              discogs_id: scan.discogs_id
            }
          };
        }),
      // Blog Posts
      ...blogPosts.filter(post => new Date(post.created_at) >= sevenDaysAgoActivity)
        .map(post => {
          const user = allUsers.users?.find(u => u.id === post.user_id);
          const profile = profiles.find(p => p.user_id === post.user_id);
          return {
            activity_id: post.id,
            user_id: post.user_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'blog_post',
            created_at: post.created_at,
            title: post.title,
            metadata: {
              is_published: post.is_published,
              auto_generated: post.auto_generated,
              view_count: post.view_count
            }
          };
        }),
      // Quiz Results
      ...quizResults.filter(quiz => new Date(quiz.created_at) >= sevenDaysAgoActivity)
        .map(quiz => {
          const user = allUsers.users?.find(u => u.id === quiz.user_id);
          const profile = profiles.find(p => p.user_id === quiz.user_id);
          return {
            activity_id: quiz.id,
            user_id: quiz.user_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'quiz_result',
            created_at: quiz.created_at,
            metadata: {
              score_percentage: quiz.score_percentage,
              questions_total: quiz.questions_total,
              questions_correct: quiz.questions_correct,
              quiz_type: quiz.quiz_type
            }
          };
        }),
      // Follows
      ...follows.filter(follow => new Date(follow.created_at) >= sevenDaysAgoActivity)
        .map(follow => {
          const followerUser = allUsers.users?.find(u => u.id === follow.follower_id);
          const followerProfile = profiles.find(p => p.user_id === follow.follower_id);
          const followingUser = allUsers.users?.find(u => u.id === follow.following_id);
          const followingProfile = profiles.find(p => p.user_id === follow.following_id);
          return {
            activity_id: follow.id,
            user_id: follow.follower_id,
            user_email: followerUser?.email || 'Unknown',
            user_name: followerProfile?.first_name || 'Unknown',
            type: 'follow',
            created_at: follow.created_at,
            metadata: {
              following_user_email: followingUser?.email,
              following_user_name: followingProfile?.first_name
            }
          };
        }),
      // Shop Orders
      ...shopOrders.filter(order => new Date(order.created_at) >= sevenDaysAgoActivity)
        .map(order => {
          const user = allUsers.users?.find(u => u.id === order.buyer_id);
          const profile = profiles.find(p => p.user_id === order.buyer_id);
          return {
            activity_id: order.id,
            user_id: order.buyer_id,
            user_email: user?.email || 'Unknown',
            user_name: profile?.first_name || 'Unknown',
            type: 'shop_order',
            created_at: order.created_at,
            metadata: {
              status: order.status,
              total_amount: order.total_amount,
              currency: order.currency
            }
          };
        })
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Discogs matches and confidence
    const discogsMatches = 
      aiScans.filter(scan => scan.discogs_id).length +
      cdScans.filter(scan => scan.discogs_id).length +
      vinylScans.filter(scan => scan.discogs_id).length;

    const completedAIScans = aiScans.filter(scan => scan.status === 'completed' && scan.confidence_score);
    const avgConfidence = completedAIScans.length > 0
      ? completedAIScans.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0) / completedAIScans.length
      : 0;

    // Error calculation
    const totalErrors = aiScansFailed + batchUploads.filter(b => b.status === 'failed').length;

    // Calculate artwork statistics
    const aiScansWithoutArtwork = aiScans.filter(s => !s.artwork_url).length;
    const cdScansWithoutArtwork = cdScans.filter(s => !s.front_image).length;
    const vinylScansWithoutArtwork = vinylScans.filter(s => !s.catalog_image).length;
    
    const totalScansWithArtwork = aiScans.filter(s => s.artwork_url).length +
                                  cdScans.filter(s => s.front_image).length +
                                  vinylScans.filter(s => s.catalog_image).length;

    // Get last batch processing info (mock for now - could be extended with actual batch logs)
    const artworkStats = {
      aiScansWithoutArtwork,
      cdScansWithoutArtwork,
      vinylScansWithoutArtwork,
      totalScansWithArtwork,
      totalScans,
      lastBatchRun: null, // Could be fetched from a batch_logs table
      batchSuccessRate: 85.2, // Mock data - could be calculated from actual batch runs
      cronjobStatus: 'active' as const // Now we have an active cronjob
    };

    // Assemble final statistics
    const stats = {
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      avgDailyUsers: Math.round(newUsersLast30Days / 30),
      totalScans,
      aiScans: aiScans.length,
      aiScansWithPricing,
      aiScansPending,
      aiScansFailed,
      cdScans: cdScans.length,
      cdScansWithPricing,
      vinylScans: vinylScans.length,
      vinylScansWithPricing,
      batchUploads: batchUploads.length,
      scansToday,
      topArtists,
      topUsers,
      recentActivity,
      userActivities,
      discogsMatches,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      totalErrors,
      uniqueArtists: Object.keys(artistCounts).length,
      artworkStats
    };

    console.log('✅ Successfully compiled superadmin statistics');

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in superadmin-stats function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});