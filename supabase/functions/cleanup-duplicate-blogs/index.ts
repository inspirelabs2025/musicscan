import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  id: string;
  slug: string;
  album_id: string;
  album_type: string;
  yaml_frontmatter: any;
  views_count: number;
  created_at: string;
}

interface DuplicateGroup {
  artist: string;
  album: string;
  posts: BlogPost[];
}

interface CleanupReport {
  totalPosts: number;
  duplicateGroups: number;
  postsToKeep: number;
  postsDeleted: number;
  deletedPosts: Array<{ id: string; slug: string; artist: string; album: string; reason: string }>;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting duplicate blog cleanup...');

    // Fetch all blog posts
    const { data: allPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, album_id, album_type, yaml_frontmatter, views_count, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch blog posts: ${fetchError.message}`);
    }

    console.log(`📊 Found ${allPosts.length} total blog posts`);

    // Group by artist + album (case-insensitive)
    const groups = new Map<string, BlogPost[]>();

    for (const post of allPosts) {
      const artist = post.yaml_frontmatter?.artist || '';
      const album = post.yaml_frontmatter?.album || '';
      
      if (!artist || !album) {
        console.log(`⚠️ Skipping post ${post.id}: missing artist or album`);
        continue;
      }

      const key = `${artist.toLowerCase().trim()}|||${album.toLowerCase().trim()}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(post);
    }

    console.log(`🔍 Found ${groups.size} unique artist+album combinations`);

    // Find duplicate groups (more than 1 post per artist+album)
    const duplicateGroups: DuplicateGroup[] = [];
    
    for (const [key, posts] of groups.entries()) {
      if (posts.length > 1) {
        const [artist, album] = key.split('|||');
        duplicateGroups.push({ artist, album, posts });
      }
    }

    console.log(`🔄 Found ${duplicateGroups.length} duplicate groups`);

    const report: CleanupReport = {
      totalPosts: allPosts.length,
      duplicateGroups: duplicateGroups.length,
      postsToKeep: duplicateGroups.length,
      postsDeleted: 0,
      deletedPosts: [],
      errors: []
    };

    // Process each duplicate group
    for (const group of duplicateGroups) {
      console.log(`\n📦 Processing duplicate group: ${group.artist} - ${group.album} (${group.posts.length} posts)`);

      // Sort posts by priority:
      // 1. Highest views_count
      // 2. Earliest year (prefer original release)
      // 3. Oldest created_at
      const sortedPosts = [...group.posts].sort((a, b) => {
        // Priority 1: Views
        if (b.views_count !== a.views_count) {
          return b.views_count - a.views_count;
        }

        // Priority 2: Year (prefer earliest, but treat 'unknown' as lowest priority)
        const yearA = a.yaml_frontmatter?.year;
        const yearB = b.yaml_frontmatter?.year;
        
        const isUnknownA = !yearA || yearA === 'unknown' || a.slug.includes('-unknown');
        const isUnknownB = !yearB || yearB === 'unknown' || b.slug.includes('-unknown');
        
        if (isUnknownA && !isUnknownB) return 1;
        if (!isUnknownA && isUnknownB) return -1;
        
        if (yearA && yearB && yearA !== yearB) {
          return yearA - yearB; // Earlier year wins
        }

        // Priority 3: Created date (oldest)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const postToKeep = sortedPosts[0];
      const postsToDelete = sortedPosts.slice(1);

      console.log(`  ✅ Keeping: ${postToKeep.slug} (views: ${postToKeep.views_count}, year: ${postToKeep.yaml_frontmatter?.year || 'unknown'})`);

      // Delete duplicates
      for (const post of postsToDelete) {
        console.log(`  ❌ Deleting: ${post.slug} (views: ${post.views_count}, year: ${post.yaml_frontmatter?.year || 'unknown'})`);
        
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', post.id);

        if (deleteError) {
          const errorMsg = `Failed to delete ${post.slug}: ${deleteError.message}`;
          console.error(`  ⚠️ ${errorMsg}`);
          report.errors.push(errorMsg);
        } else {
          report.postsDeleted++;
          report.deletedPosts.push({
            id: post.id,
            slug: post.slug,
            artist: group.artist,
            album: group.album,
            reason: `Duplicate (kept ${postToKeep.slug} with ${postToKeep.views_count} views)`
          });
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Final report:`);
    console.log(`   - Total posts scanned: ${report.totalPosts}`);
    console.log(`   - Duplicate groups found: ${report.duplicateGroups}`);
    console.log(`   - Posts kept: ${report.postsToKeep}`);
    console.log(`   - Posts deleted: ${report.postsDeleted}`);
    console.log(`   - Errors: ${report.errors.length}`);

    return new Response(
      JSON.stringify(report, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in cleanup-duplicate-blogs:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
