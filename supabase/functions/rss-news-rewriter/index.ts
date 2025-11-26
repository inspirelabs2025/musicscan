import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content?: string;
}

async function parseRSS(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    
    // Parse RSS XML manually (simple parser for most RSS feeds)
    const items: RSSItem[] = [];
    const itemMatches = xml.matchAll(/<item>(.*?)<\/item>/gs);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s)?.[1] || 
                   itemXml.match(/<title>(.*?)<\/title>/s)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/s)?.[1]?.trim() || '';
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s)?.[1] || 
                         itemXml.match(/<description>(.*?)<\/description>/s)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
      const content = itemXml.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s)?.[1] || '';
      
      if (title && description) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          description: description.trim().replace(/<[^>]*>/g, ''),
          pubDate: pubDate.trim(),
          content: content.trim().replace(/<[^>]*>/g, '')
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
}

async function rewriteWithAI(originalTitle: string, originalContent: string): Promise<{ title: string; content: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY niet geconfigureerd");
  }

  const prompt = `Je bent een professionele redacteur van Musicscan.nl, een Nederlandse muziekwebsite.

ORIGINEEL ARTIKEL:
Titel: ${originalTitle}
Inhoud: ${originalContent}

OPDRACHT:
Herschrijf dit artikel VOLLEDIG in je eigen woorden voor Musicscan.nl. 

REGELS:
- Gebruik ALLE feiten en informatie uit het origineel
- Schrijf het artikel COMPLEET anders: andere zinsopbouw, andere woordkeuze, andere volgorde
- GEEN enkele zin mag lijken op het origineel
- Schrijf in professionele Nederlandse schrijfstijl voor een muziekwebsite
- Geen bronvermelding, geen links, geen verwijzingen naar origineel
- Zorg dat het artikel minimaal 300 woorden bevat
- Gebruik alinea's voor leesbaarheid
- Schrijf alsof Redactie Musicscan dit zelf heeft geschreven

FORMAAT:
Geef alleen de nieuwe titel en nieuwe inhoud terug in dit format:
TITEL: [nieuwe titel]
INHOUD: [nieuwe inhoud in markdown format met alinea's]`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response
    const titleMatch = aiResponse.match(/TITEL:\s*(.+?)(?=\n|INHOUD:|$)/s);
    const contentMatch = aiResponse.match(/INHOUD:\s*(.+)/s);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : originalTitle,
      content: contentMatch ? contentMatch[1].trim() : aiResponse
    };
  } catch (error) {
    console.error("AI rewrite error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { manual, limit = 10 } = await req.json().catch(() => ({ manual: false, limit: 10 }));

    console.log(`RSS news rewriter started (manual: ${manual}, limit: ${limit})`);

    // Get active RSS feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('news_rss_feeds')
      .select('*')
      .eq('is_active', true)
      .order('last_fetched_at', { ascending: true, nullsFirst: true });

    if (feedsError) throw feedsError;
    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: 'Geen actieve RSS feeds gevonden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalProcessed = 0;
    let totalCreated = 0;
    const results = [];

    for (const feed of feeds) {
      if (totalCreated >= limit) break;

      console.log(`Processing feed: ${feed.feed_name}`);
      
      const items = await parseRSS(feed.feed_url);
      console.log(`Found ${items.length} items in ${feed.feed_name}`);

      for (const item of items.slice(0, limit - totalCreated)) {
        totalProcessed++;
        
        // Check for duplicates based on similar titles
        const { data: existingPosts } = await supabase
          .from('blog_posts')
          .select('id')
          .ilike('yaml_frontmatter->>title', `%${item.title.slice(0, 30)}%`)
          .limit(1);

        if (existingPosts && existingPosts.length > 0) {
          console.log(`Skipping duplicate: ${item.title}`);
          continue;
        }

        try {
          // Rewrite with AI
          const contentToRewrite = item.content || item.description;
          const rewritten = await rewriteWithAI(item.title, contentToRewrite);
          
          // Generate slug
          const slug = `nieuws-${Date.now()}-${item.title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50)}`;

          // Create blog post
          const { data: newPost, error: postError } = await supabase
            .from('blog_posts')
            .insert({
              album_id: crypto.randomUUID(),
              album_type: 'news',
              slug,
              markdown_content: rewritten.content,
              yaml_frontmatter: {
                title: rewritten.title,
                artist: 'Redactie Musicscan',
                author: 'Redactie Musicscan',
                category: feed.category || 'Nieuws',
                tags: ['nieuws', 'muzieknieuws'],
                source: 'Musicscan',
                published_date: new Date().toISOString()
              },
              is_published: true,
              published_at: new Date().toISOString(),
              user_id: '00000000-0000-0000-0000-000000000000' // System user
            })
            .select()
            .single();

          if (postError) {
            console.error(`Error creating post: ${postError.message}`);
            continue;
          }

          totalCreated++;
          results.push({
            title: rewritten.title,
            slug: newPost.slug,
            feed: feed.feed_name
          });

          console.log(`Created article: ${rewritten.title}`);
        } catch (error) {
          console.error(`Error processing item: ${error.message}`);
        }
      }

      // Update feed last_fetched_at
      await supabase
        .from('news_rss_feeds')
        .update({ 
          last_fetched_at: new Date().toISOString(),
          articles_fetched_count: feed.articles_fetched_count + totalCreated
        })
        .eq('id', feed.id);
    }

    console.log(`RSS rewriter completed: ${totalCreated} articles created from ${totalProcessed} processed`);

    return new Response(JSON.stringify({
      success: true,
      processed: totalProcessed,
      created: totalCreated,
      articles: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rss-news-rewriter:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
