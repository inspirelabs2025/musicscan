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
    const { 
      scan_id, 
      album_id, 
      media_type, 
      user_id, 
      auto_generated = true 
    } = await req.json();

    console.log('Auto blog generation triggered for:', { 
      scan_id, 
      album_id, 
      media_type, 
      user_id 
    });

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get album data to check for cross-media duplicates
    let albumData = null;
    try {
      const tableName = media_type === 'vinyl' ? 'vinyl2_scan' : media_type === 'cd' ? 'cd_scan' : 'ai_scan_results';
      const { data } = await supabase
        .from(tableName)
        .select('discogs_id, artist, title')
        .eq('id', album_id)
        .single();
      albumData = data;
    } catch (error) {
      console.error('Error fetching album data:', error);
    }

    // Check if blog post already exists for this specific album+media_type
    const { data: existingBlog, error: checkError } = await supabase
      .from('blog_posts')
      .select('id, album_type')
      .eq('album_id', album_id)
      .eq('album_type', media_type)
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing blog:', checkError);
      throw checkError;
    }

    // Check for cross-media-type duplicates based on discogs_id or artist+title
    let crossMediaDuplicate = null;
    if (albumData && !existingBlog) {
      let duplicateQuery = supabase
        .from('blog_posts')
        .select('id, album_type, yaml_frontmatter')
        .eq('user_id', user_id);

      if (albumData.discogs_id) {
        // Use discogs_id for more accurate matching
        const { data: discogsMatches } = await duplicateQuery
          .not('yaml_frontmatter', 'is', null)
          .not('yaml_frontmatter->discogs_id', 'is', null)
          .eq('yaml_frontmatter->discogs_id', albumData.discogs_id);
        
        if (discogsMatches && discogsMatches.length > 0) {
          crossMediaDuplicate = discogsMatches[0];
          console.log('Found cross-media duplicate by discogs_id:', albumData.discogs_id);
        }
      } else if (albumData.artist && albumData.title) {
        // Fallback to artist+title matching
        const { data: titleMatches } = await duplicateQuery
          .not('yaml_frontmatter', 'is', null)
          .ilike('yaml_frontmatter->artist', `%${albumData.artist}%`)
          .ilike('yaml_frontmatter->title', `%${albumData.title}%`);
        
        if (titleMatches && titleMatches.length > 0) {
          crossMediaDuplicate = titleMatches[0];
          console.log('Found cross-media duplicate by artist+title:', albumData.artist, '-', albumData.title);
        }
      }
    }

    if (checkError) {
      console.error('Error checking existing blog:', checkError);
      throw checkError;
    }

    // If blog already exists, skip generation
    if (existingBlog) {
      console.log('Blog post already exists for album:', album_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Blog post already exists',
          blog_id: existingBlog.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // If cross-media duplicate exists, skip generation
    if (crossMediaDuplicate) {
      console.log('Cross-media duplicate blog exists:', crossMediaDuplicate.id, 'type:', crossMediaDuplicate.album_type);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Blog post already exists for this album as ${crossMediaDuplicate.album_type}`,
          blog_id: crossMediaDuplicate.id,
          duplicate_type: crossMediaDuplicate.album_type
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Check user's auto-generation preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('auto_blog_generation')
      .eq('user_id', user_id)
      .single();

    if (profile?.auto_blog_generation === false) {
      console.log('Auto blog generation disabled for user:', user_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auto blog generation disabled for user' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Start background blog generation
    const blogGenerationTask = async () => {
      try {
        console.log('Starting background blog generation...');
        
        const { data: blogResult, error: blogError } = await supabase.functions.invoke('plaat-verhaal-generator', {
          body: {
            albumId: album_id,
            albumType: media_type,
            forceRegenerate: false,
            autoGenerated: true,
            autoPublish: true
          }
        });

        if (blogError) {
          console.error('Background blog generation error:', blogError);
          return;
        }

        console.log('Background blog generation completed:', blogResult);

        if (blogResult?.id) {
          console.log('Auto-generated blog published:', blogResult.id);
        }
      } catch (error) {
        console.error('Background blog generation failed:', error);
      }
    };

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(blogGenerationTask());
    } else {
      // Fallback for development/testing
      blogGenerationTask();
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Blog generation started in background',
        album_id,
        media_type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in auto-blog-trigger function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});