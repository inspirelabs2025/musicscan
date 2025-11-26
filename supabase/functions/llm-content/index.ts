import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to strip HTML tags and convert to clean text
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

// Generate Markdown for blog posts (plaat-verhaal)
const generateBlogMarkdown = (blog: any): string => {
  const frontmatter = blog.yaml_frontmatter || {};
  const artist = frontmatter.artist || '';
  const album = frontmatter.album || '';
  const title = frontmatter.title || blog.title || 'Album Story';
  const description = frontmatter.description || blog.excerpt || '';
  const genre = frontmatter.genre || '';
  const year = frontmatter.year || '';
  
  let markdown = `# ${artist} - ${album}\n\n`;
  
  if (description) {
    markdown += `${description}\n\n`;
  }
  
  markdown += `**Genre:** ${genre}\n`;
  markdown += `**Jaar:** ${year}\n\n`;
  markdown += `---\n\n`;
  
  // Add the main content
  if (blog.markdown_content) {
    markdown += blog.markdown_content;
  }
  
  markdown += `\n\n---\n\n`;
  markdown += `*Bron: MusicScan - https://www.musicscan.app/plaat-verhaal/${blog.slug}*\n`;
  
  return markdown;
};

// Generate Markdown for music stories (muziek-verhaal)
const generateStoryMarkdown = (story: any): string => {
  const frontmatter = story.yaml_frontmatter || {};
  const title = frontmatter.title || story.title || 'Music Story';
  const artist = frontmatter.artist || '';
  const description = frontmatter.description || story.excerpt || '';
  
  let markdown = `# ${title}\n\n`;
  
  if (artist) {
    markdown += `**Artiest:** ${artist}\n\n`;
  }
  
  if (description) {
    markdown += `${description}\n\n`;
  }
  
  markdown += `---\n\n`;
  
  // Add the main content
  if (story.story_content) {
    // Clean HTML if present
    const cleanContent = stripHtml(story.story_content);
    markdown += cleanContent;
  }
  
  markdown += `\n\n---\n\n`;
  markdown += `*Bron: MusicScan - https://www.musicscan.app/muziek-verhaal/${story.slug}*\n`;
  
  return markdown;
};

// Generate Markdown for artists
const generateArtistMarkdown = (artist: any): string => {
  let markdown = `# ${artist.artist_name}\n\n`;
  
  if (artist.biography) {
    markdown += `## Biografie\n\n${stripHtml(artist.biography)}\n\n`;
  }
  
  if (artist.music_style && artist.music_style.length > 0) {
    markdown += `**Muziekstijl:** ${artist.music_style.join(', ')}\n\n`;
  }
  
  if (artist.story_content) {
    markdown += `## Verhaal\n\n${stripHtml(artist.story_content)}\n\n`;
  }
  
  if (artist.cultural_impact) {
    markdown += `## Culturele Impact\n\n${stripHtml(artist.cultural_impact)}\n\n`;
  }
  
  if (artist.notable_albums && artist.notable_albums.length > 0) {
    markdown += `## Bekende Albums\n\n`;
    artist.notable_albums.forEach((album: string) => {
      markdown += `- ${album}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*Bron: MusicScan - https://www.musicscan.app/artist/${artist.slug}*\n`;
  
  return markdown;
};

// Generate Markdown for anecdotes
const generateAnecdoteMarkdown = (anecdote: any): string => {
  let markdown = `# ${anecdote.title}\n\n`;
  
  if (anecdote.artist_name) {
    markdown += `**Artiest:** ${anecdote.artist_name}\n`;
  }
  
  if (anecdote.album_title) {
    markdown += `**Album:** ${anecdote.album_title}\n`;
  }
  
  if (anecdote.year) {
    markdown += `**Jaar:** ${anecdote.year}\n`;
  }
  
  markdown += `\n---\n\n`;
  
  if (anecdote.content) {
    markdown += stripHtml(anecdote.content);
  }
  
  markdown += `\n\n---\n\n`;
  markdown += `*Bron: MusicScan - https://www.musicscan.app/anekdotes/${anecdote.slug}*\n`;
  
  return markdown;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log('[LLM-Content] Request path:', url.pathname);
    
    // Expected format: /api/llm/{content-type}/{slug}.md
    // or: /llm-content/api/llm/{content-type}/{slug}.md (with function prefix)
    
    // Find where 'api' starts in the path
    const apiIndex = pathParts.indexOf('api');
    if (apiIndex === -1 || pathParts.length < apiIndex + 3) {
      return new Response('Invalid path format. Expected: /api/llm/{type}/{slug}.md', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    const contentType = pathParts[apiIndex + 2]; // 'plaat-verhaal', 'muziek-verhaal', etc.
    const slugWithExt = pathParts[apiIndex + 3]; // 'some-slug.md'
    const slug = slugWithExt.replace(/\.md$/, '');
    
    console.log('[LLM-Content] Content type:', contentType, 'Slug:', slug);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let markdown = '';

    switch (contentType) {
      case 'plaat-verhaal': {
        const { data: blog, error } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !blog) {
          return new Response('Blog post not found', {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }

        markdown = generateBlogMarkdown(blog);
        break;
      }

      case 'muziek-verhaal': {
        const { data: story, error } = await supabaseClient
          .from('music_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !story) {
          return new Response('Music story not found', {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }

        markdown = generateStoryMarkdown(story);
        break;
      }

      case 'artists': {
        const { data: artist, error } = await supabaseClient
          .from('artist_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !artist) {
          return new Response('Artist not found', {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }

        markdown = generateArtistMarkdown(artist);
        break;
      }

      case 'anekdotes': {
        const { data: anecdote, error } = await supabaseClient
          .from('music_anecdotes')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !anecdote) {
          return new Response('Anecdote not found', {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }

        markdown = generateAnecdoteMarkdown(anecdote);
        break;
      }

      default:
        return new Response(`Unknown content type: ${contentType}`, {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
    }

    return new Response(markdown, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    });

  } catch (error) {
    console.error('[LLM-Content] Error:', error);
    return new Response(error instanceof Error ? error.message : 'Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});
