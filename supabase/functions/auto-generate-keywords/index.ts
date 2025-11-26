import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentItem {
  id: string;
  table: string;
  artist?: string;
  title?: string;
  album_title?: string;
  artist_name?: string;
  genre?: string;
  year?: number;
  yaml_frontmatter?: any;
  music_style?: string[];
  existing_keywords?: string[];
}

async function generateKeywords(
  content: ContentItem, 
  allKeywords: string[], 
  apiKey: string
): Promise<string[]> {
  const contextKeywords = allKeywords.slice(0, 50).join(', ');
  
  const prompt = `Genereer 5-8 specifieke long-tail SEO trefwoorden voor:

${content.table === 'blog_posts' ? 'Album' : content.table === 'artist_stories' ? 'Artiest' : 'Content'}: 
- Artiest: ${content.artist_name || content.artist || 'Onbekend'}
- Titel: ${content.title || content.album_title || 'Onbekend'}
- Genre: ${content.genre || (content.music_style || []).join(', ') || 'Onbekend'}
- Jaar: ${content.year || 'Onbekend'}

Bestaande keywords op site: ${contextKeywords}

${content.existing_keywords?.length ? `Huidige keywords: ${content.existing_keywords.join(', ')}` : ''}

Regels:
1. Bouw voort op bestaande keywords trends
2. Gebruik Nederlandse zoektermen
3. Focus op verzamelaars-vragen ("herkennen", "waarde", "first pressing")
4. Combineer genre + format + jaartal
5. Specifieke niche subcategorieën
6. ${content.existing_keywords?.length ? 'Verbeter/vul aan, geen duplicaten' : 'Maak nieuwe unieke keywords'}

Geef ALLEEN trefwoorden, gescheiden door komma's.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Je bent een SEO expert. Geef alleen keywords, gescheiden door komma\'s.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const keywordsText = data.choices[0].message.content;
  
  return keywordsText
    .split(',')
    .map((k: string) => k.trim().toLowerCase())
    .filter((k: string) => k.length > 3 && k.length < 80);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Auto-generate keywords starting...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { limit = 20, mode = 'missing' } = await req.json().catch(() => ({}));

    // Collect all existing keywords for context
    console.log('📊 Collecting existing keywords...');
    const { data: existingBlogs } = await supabaseClient
      .from('blog_posts')
      .select('yaml_frontmatter')
      .not('yaml_frontmatter->seo_keywords', 'is', null)
      .limit(100);

    const allKeywords: string[] = [];
    existingBlogs?.forEach((blog: any) => {
      const keywords = blog.yaml_frontmatter?.seo_keywords || [];
      allKeywords.push(...keywords);
    });

    const uniqueKeywords = [...new Set(allKeywords)];
    console.log(`Found ${uniqueKeywords.length} unique existing keywords`);

    const stats = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      by_table: {} as Record<string, number>
    };

    // Process blog_posts
    console.log('📝 Processing blog posts...');
    const blogQuery = supabaseClient
      .from('blog_posts')
      .select('id, yaml_frontmatter')
      .eq('is_published', true)
      .limit(limit);

    if (mode === 'missing') {
      blogQuery.is('yaml_frontmatter->seo_keywords', null);
    }

    const { data: blogs, error: blogsError } = await blogQuery;

    if (!blogsError && blogs) {
      for (const blog of blogs) {
        try {
          stats.processed++;
          const frontmatter = blog.yaml_frontmatter || {};
          const existingKeywords = frontmatter.seo_keywords || [];

          const content: ContentItem = {
            id: blog.id,
            table: 'blog_posts',
            artist: frontmatter.artist,
            title: frontmatter.title,
            genre: frontmatter.genre,
            year: frontmatter.year,
            existing_keywords: existingKeywords
          };

          const keywords = await generateKeywords(content, uniqueKeywords, LOVABLE_API_KEY);

          // Merge with existing if mode is 'improve'
          const finalKeywords = mode === 'improve' 
            ? [...new Set([...existingKeywords, ...keywords])]
            : keywords;

          const { error: updateError } = await supabaseClient
            .from('blog_posts')
            .update({
              yaml_frontmatter: {
                ...frontmatter,
                seo_keywords: finalKeywords
              }
            })
            .eq('id', blog.id);

          if (updateError) {
            console.error(`Error updating blog ${blog.id}:`, updateError);
            stats.errors++;
          } else {
            stats.updated++;
            stats.by_table['blog_posts'] = (stats.by_table['blog_posts'] || 0) + 1;
            uniqueKeywords.push(...keywords); // Add to pool
          }
        } catch (error) {
          console.error(`Error processing blog:`, error);
          stats.errors++;
        }
      }
    }

    // Process artist_stories
    console.log('🎤 Processing artist stories...');
    const storiesQuery = supabaseClient
      .from('artist_stories')
      .select('id, artist_name, music_style, slug')
      .eq('is_published', true)
      .limit(Math.floor(limit / 2));

    const { data: stories, error: storiesError } = await storiesQuery;

    if (!storiesError && stories) {
      for (const story of stories) {
        try {
          stats.processed++;

          const content: ContentItem = {
            id: story.id,
            table: 'artist_stories',
            artist_name: story.artist_name,
            title: story.artist_name,
            music_style: story.music_style,
            existing_keywords: []
          };

          const keywords = await generateKeywords(content, uniqueKeywords, LOVABLE_API_KEY);

          // Store in a new field or use meta_description for now
          const { error: updateError } = await supabaseClient
            .from('artist_stories')
            .update({
              meta_description: `${story.artist_name} - ${keywords.slice(0, 3).join(', ')}`
            })
            .eq('id', story.id);

          if (updateError) {
            console.error(`Error updating story ${story.id}:`, updateError);
            stats.errors++;
          } else {
            stats.updated++;
            stats.by_table['artist_stories'] = (stats.by_table['artist_stories'] || 0) + 1;
            uniqueKeywords.push(...keywords);
          }
        } catch (error) {
          console.error(`Error processing story:`, error);
          stats.errors++;
        }
      }
    }

    // Process music_stories (singles)
    console.log('💿 Processing singles...');
    const singlesQuery = supabaseClient
      .from('music_stories')
      .select('id, artist, single_name, genre, year')
      .eq('is_published', true)
      .not('single_name', 'is', null)
      .limit(Math.floor(limit / 4));

    const { data: singles, error: singlesError } = await singlesQuery;

    if (!singlesError && singles) {
      for (const single of singles) {
        try {
          stats.processed++;

          const content: ContentItem = {
            id: single.id,
            table: 'music_stories',
            artist: single.artist,
            title: single.single_name,
            genre: single.genre,
            year: single.year,
            existing_keywords: []
          };

          const keywords = await generateKeywords(content, uniqueKeywords, LOVABLE_API_KEY);

          const { error: updateError } = await supabaseClient
            .from('music_stories')
            .update({
              meta_description: `${single.artist} - ${single.single_name} - ${keywords.slice(0, 3).join(', ')}`
            })
            .eq('id', single.id);

          if (updateError) {
            console.error(`Error updating single ${single.id}:`, updateError);
            stats.errors++;
          } else {
            stats.updated++;
            stats.by_table['music_stories'] = (stats.by_table['music_stories'] || 0) + 1;
            uniqueKeywords.push(...keywords);
          }
        } catch (error) {
          console.error(`Error processing single:`, error);
          stats.errors++;
        }
      }
    }

    console.log('✅ Auto-generate keywords completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        total_unique_keywords: uniqueKeywords.length,
        completed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in auto-generate-keywords:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
