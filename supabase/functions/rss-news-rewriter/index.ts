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

// Extract keywords from text for duplicate detection
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful keywords (min 3 chars)
  const commonWords = ['het', 'de', 'een', 'van', 'in', 'op', 'voor', 'met', 'door', 'aan', 'naar', 'over', 'bij', 'uit', 'als', 'zijn', 'dat', 'die', 'dit', 'en', 'of', 'maar', 'om', 'jaar', 'nieuwe', 'new'];
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !commonWords.includes(word));
  
  // Return unique words
  return [...new Set(words)];
}

// Generate news image with AI
async function generateNewsImage(
  title: string, 
  content: string,
  lovableApiKey: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string | null> {
  try {
    // 1. Generate image prompt based on article
    const promptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Genereer een korte image prompt (max 100 woorden) voor een nieuwsartikel:
        
Titel: ${title}
Inhoud: ${content.slice(0, 500)}

De prompt moet resulteren in een professionele, journalistieke foto die past bij dit muzieknieuws.
Denk aan: concertfoto, artiest portret, muziekinstrumenten, platenzaak, studio setting, etc.
Vermijd: tekst, logo's, specifieke gezichten van echte mensen.

Return ALLEEN de image prompt, geen uitleg.`
        }],
      }),
    });

    if (!promptResponse.ok) {
      console.error('Failed to generate image prompt:', promptResponse.status);
      return null;
    }

    const promptData = await promptResponse.json();
    const imagePrompt = promptData.choices[0].message.content;

    // 2. Generate the image
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ 
          role: 'user', 
          content: `${imagePrompt}

Style: Professional journalism photography, high quality, 16:9 aspect ratio, editorial style for music news website.`
        }],
        modalities: ['image', 'text'],
      }),
    });

    if (!imageResponse.ok) {
      console.error('Failed to generate image:', imageResponse.status);
      return null;
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      console.error('No image returned from AI');
      return null;
    }

    // 3. Upload to Supabase storage
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const filename = `news/${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.png`;
    
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/news-images/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'image/png',
        },
        body: binaryData,
      }
    );

    if (!uploadResponse.ok) {
      console.error('Failed to upload image to storage:', uploadResponse.status);
      return null;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/news-images/${filename}`;
    console.log(`✅ Image generated and uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error generating news image:', error);
    return null;
  }
}

async function rewriteWithAI(originalTitle: string, originalContent: string): Promise<{ title: string; content: string; summary: string }> {
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
Geef de nieuwe titel, korte samenvatting (2-3 zinnen) en inhoud terug in dit format:
TITEL: [nieuwe titel]
SAMENVATTING: [korte pakkende samenvatting van 2-3 zinnen]
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
    const titleMatch = aiResponse.match(/TITEL:\s*(.+?)(?=\n|SAMENVATTING:|$)/s);
    const summaryMatch = aiResponse.match(/SAMENVATTING:\s*(.+?)(?=\n|INHOUD:|$)/s);
    const contentMatch = aiResponse.match(/INHOUD:\s*(.+)/s);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : originalTitle,
      summary: summaryMatch ? summaryMatch[1].trim() : '',
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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
        
        // STAP 1: Check for duplicates based on source URL (most reliable)
        const { data: existingByUrl } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('album_type', 'news')
          .eq('yaml_frontmatter->>source_url', item.link)
          .limit(1);

        if (existingByUrl && existingByUrl.length > 0) {
          console.log(`Skipping (URL exists): ${item.title}`);
          continue;
        }

        // STAP 2: Check for duplicates based on keywords in title
        const keywords = extractKeywords(item.title);
        console.log(`Keywords for "${item.title}":`, keywords.slice(0, 5));
        
        if (keywords.length >= 2) {
          const { data: recentPosts } = await supabase
            .from('blog_posts')
            .select('id, yaml_frontmatter')
            .eq('album_type', 'news')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(50);

          // Check if multiple keywords match with existing posts
          const isDuplicate = recentPosts?.some(post => {
            const existingTitle = (post.yaml_frontmatter?.title || post.yaml_frontmatter?.original_title || '').toLowerCase();
            const matchCount = keywords.filter(kw => existingTitle.includes(kw)).length;
            
            if (matchCount >= 2) {
              console.log(`Potential duplicate found: "${existingTitle}" matches ${matchCount} keywords`);
              return true;
            }
            return false;
          });

          if (isDuplicate) {
            console.log(`Skipping (keyword match): ${item.title}`);
            continue;
          }
        }

        try {
          // Rewrite with AI
          const contentToRewrite = item.content || item.description;
          const rewritten = await rewriteWithAI(item.title, contentToRewrite);
          
          // Generate image for the article
          console.log(`Generating image for: ${rewritten.title}`);
          const imageUrl = await generateNewsImage(
            rewritten.title,
            rewritten.content,
            lovableApiKey,
            supabaseUrl,
            supabaseKey
          );
          
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
              album_cover_url: imageUrl,
              markdown_content: rewritten.content,
              yaml_frontmatter: {
                title: rewritten.title,
                description: rewritten.summary, // Add summary for preview
                artist: 'Redactie Musicscan',
                author: 'Redactie Musicscan',
                category: feed.category || 'Nieuws',
                tags: ['nieuws', 'muzieknieuws'],
                source: 'Musicscan',
                source_url: item.link, // Original RSS link for duplicate detection
                original_title: item.title, // Original title for debugging
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

          // Auto-post to Facebook
          try {
            const newsUrl = `https://www.musicscan.app/blog/${newPost.slug}`;
            const fbResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-facebook`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                content_type: 'news',
                title: rewritten.title,
                content: rewritten.summary || rewritten.content.substring(0, 300) + '...',
                url: newsUrl,
                image_url: imageUrl,
                hashtags: ['MusicScan', 'MuziekNieuws', 'Nieuws', 'Muziek']
              })
            });
            
            const fbResult = await fbResponse.json();
            if (fbResult.success) {
              console.log(`✅ Posted to Facebook: ${fbResult.post_id}`);
            } else {
              console.warn(`⚠️ Facebook post failed: ${fbResult.error}`);
            }
          } catch (fbError) {
            console.error(`❌ Error posting to Facebook:`, fbError);
          }
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
