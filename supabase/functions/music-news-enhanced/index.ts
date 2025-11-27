import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  title: string;
  content: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  slug: string;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

// Nederlandse muzieknieuwssites RSS feeds (updated November 2025 - music-specific only)
const RSS_FEEDS = [
  { url: 'https://maxazine.nl/feed/', source: 'Maxazine', category: 'Concert nieuws' },
  { url: 'https://www.rockportaal.nl/feed/', source: 'Rockportaal', category: 'Album reviews' },
  { url: 'https://www.musicframes.nl/feed/', source: 'Music Frames', category: 'Album reviews' },
  { url: 'https://www.artiestennieuws.nl/feed/', source: 'Artiesten Nieuws', category: 'Artiest nieuws' },
];

// Helper function to create URL-safe slugs
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àáâäã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

// Check if a date is within the last 3 days (less strict)
function isRecentDate(dateString: string): boolean {
  try {
    const itemDate = new Date(dateString);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return itemDate >= threeDaysAgo && itemDate <= new Date();
  } catch {
    return false;
  }
}

// Parse RSS feed with improved error handling
async function parseRSSFeed(feedUrl: string, source: string, category: string): Promise<RSSItem[]> {
  try {
    console.log(`📡 Fetching RSS feed: ${source}`);
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MuziekNieuwsBot/1.0)',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch RSS feed ${source}: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSItem[] = [];
    
    // Enhanced XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
    
    if (itemMatches) {
      for (const itemXml of itemMatches.slice(0, 10)) {
        try {
          const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
          const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i);
          const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
          const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
          
          if (titleMatch && linkMatch && pubDateMatch) {
            const title = (titleMatch[1] || '').replace(/<[^>]+>/g, '').trim();
            const pubDate = pubDateMatch[1].trim();
            const description = (descMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();
            
            if (isRecentDate(pubDate)) {
              items.push({
                title,
                link: linkMatch[1].trim(),
                pubDate,
                description: description.substring(0, 1000),
                source
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing RSS item from ${source}:`, error);
          continue;
        }
      }
    }
    
    console.log(`✅ Found ${items.length} recent items from ${source}`);
    return items;
    
  } catch (error) {
    console.error(`❌ Error parsing RSS feed ${source}:`, error);
    return [];
  }
}

// Check if blog post already exists
async function isDuplicatePost(supabase: any, title: string, slug: string): Promise<boolean> {
  try {
    const titleWords = title.toLowerCase().split(' ').slice(0, 3).join(' ');
    
    const { data, error } = await supabase
      .from('news_blog_posts')
      .select('id, title')
      .or(`title.ilike.%${titleWords.replace(/'/g, "''")}%,slug.eq.${slug}`)
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5);
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      for (const existing of data) {
        const similarity = calculateSimilarity(title.toLowerCase(), existing.title.toLowerCase());
        if (similarity > 0.7) {
          console.log(`Skipping duplicate: ${title}`);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return false;
  }
}

// Simple similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const intersection = words1.filter(word => words2.includes(word));
  return intersection.length / Math.max(words1.length, words2.length);
}

// Enhanced content generation (limited calls)
async function generateEnhancedContent(topic: string, description: string, source: string, perplexityApiKey: string): Promise<string | null> {
  try {
    const currentDate = new Date().toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `Je bent een professionele Nederlandse muziekjournalist. Vandaag is ${currentDate}. 

TAAK: Schrijf een volledig, informatief nieuwsartikel van 400-600 woorden in vloeiend Nederlands.

STRUCTUUR (verplicht):
## Titel (gebruik H2)

### Introductie (2-3 paragrafen)
Geef context en belangrijkste feiten

### Hoofdverhaal (3-4 paragrafen)
Uitgebreide details, citaten indien beschikbaar, achtergrond

### Conclusie/Perspectief (1-2 paragrafen)
Wat betekent dit voor fans/industrie? Wat kunnen we verwachten?

STIJL:
- Professioneel maar toegankelijk
- Feitelijk en informatief
- Gebruik Markdown formatting
- Geen afkortingen of "[...]"
- Maak het artikel COMPLEET en AFGEROND`
          },
          {
            role: 'user',
            content: `Schrijf een volledig nieuwsartikel over: "${topic}"\n\nContext: ${description}\nBron: ${source}\n\nZorg ervoor dat het artikel minimaal 400 woorden bevat en compleet is met introductie, hoofdverhaal en conclusie.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        search_recency_filter: 'day'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (content.length < 500) {
      console.log(`Content too short (${content.length} chars) for: ${topic}`);
      return null;
    }
    
    console.log(`✅ Generated ${content.length} chars for: ${topic}`);
    return content;
    
  } catch (error) {
    console.error('Error generating enhanced content:', error);
    return null;
  }
}

// Log to database
async function logToDatabase(supabase: any, source: string, status: string, itemsProcessed: number, itemsFailed: number, errorMessage: string | null, executionTime: number) {
  try {
    await supabase.from('news_generation_logs').insert({
      source,
      status,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      error_message: errorMessage,
      execution_time_ms: executionTime
    });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🎵 Starting enhanced Dutch music news generation...');
    
    // Step 1: Fetch from multiple Dutch RSS feeds IN PARALLEL
    console.log('📡 Fetching Dutch music RSS feeds in parallel...');
    const rssPromises = RSS_FEEDS.map(feed => 
      parseRSSFeed(feed.url, feed.source, feed.category)
        .catch(error => {
          console.error(`Failed to fetch ${feed.source}:`, error);
          return [];
        })
    );
    
    const rssResults = await Promise.all(rssPromises);
    const allRSSItems = rssResults.flat();
    
    console.log(`📰 Found ${allRSSItems.length} total recent RSS items`);
    
    // Log RSS fetch result
    await logToDatabase(
      supabase,
      'rss-feeds',
      allRSSItems.length > 0 ? 'success' : 'no_items',
      allRSSItems.length,
      RSS_FEEDS.length - rssResults.filter(r => r.length > 0).length,
      null,
      Date.now() - startTime
    );
    
    // Step 2: Sort by recency
    const sortedItems = allRSSItems
      .filter(item => item.title.length > 10)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 6);
    
    // Step 3: Process items (limit to 6 Perplexity calls for better content)
    const blogPosts: BlogPost[] = [];
    const processedTitles = new Set<string>();
    let perplexityCallsUsed = 0;
    const MAX_PERPLEXITY_CALLS = 6;
    
    for (const item of sortedItems) {
      try {
        const slug = createSlug(item.title);
        const titleKey = item.title.toLowerCase().substring(0, 40);
        
        if (processedTitles.has(titleKey)) {
          continue;
        }
        processedTitles.add(titleKey);
        
        const isDuplicate = await isDuplicatePost(supabase, item.title, slug);
        if (isDuplicate) {
          continue;
        }
        
        // Generate enhanced content (required for quality)
        if (!perplexityApiKey) {
          console.error('No Perplexity API key available, skipping article');
          continue;
        }
        
        if (perplexityCallsUsed >= MAX_PERPLEXITY_CALLS) {
          console.log('Max Perplexity calls reached, stopping');
          break;
        }
        
        const enhancedContent = await generateEnhancedContent(
          item.title, 
          item.description, 
          item.source, 
          perplexityApiKey
        );
        
        if (!enhancedContent) {
          console.log(`Failed to generate content for: ${item.title}, skipping`);
          continue;
        }
        
        const content = enhancedContent;
        perplexityCallsUsed++;
        
        const blogPost: BlogPost = {
          title: item.title,
          content,
          summary: item.description.substring(0, 150).replace(/\.\.\.$/, '') + '...',
          source: item.source,
          publishedAt: new Date().toISOString(),
          category: item.source === '3voor12' ? 'Algemeen' : 
                   item.source === 'Musicmaker' ? 'Industry' :
                   item.source === 'Oor Magazine' ? 'Reviews' : 'Concert nieuws',
          slug
        };
        
        // Save to database
        const { error } = await supabase
          .from('news_blog_posts')
          .upsert({
            title: blogPost.title,
            content: blogPost.content,
            summary: blogPost.summary,
            source: blogPost.source,
            published_at: blogPost.publishedAt,
            category: blogPost.category,
            slug: blogPost.slug,
            author: 'Muzieknieuws AI'
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('Error saving blog post:', error);
        } else {
          blogPosts.push(blogPost);
          console.log(`✅ Saved: ${blogPost.title}`);
        }
        
        if (blogPosts.length >= 4) break;
        
      } catch (error) {
        console.error(`Error processing RSS item: ${item.title}`, error);
        continue;
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // Log final result
    await logToDatabase(
      supabase,
      'music-news-enhanced',
      blogPosts.length > 0 ? 'success' : 'no_posts_created',
      blogPosts.length,
      sortedItems.length - blogPosts.length,
      null,
      executionTime
    );
    
    console.log(`🎉 Completed: ${blogPosts.length} posts created in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      blogPosts: blogPosts,
      rssItemsProcessed: sortedItems.length,
      totalRssItemsFound: allRSSItems.length,
      perplexityCallsUsed,
      executionTimeMs: executionTime,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('💥 Error in enhanced music news generation:', error);
    
    // Log error to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await logToDatabase(
        supabase,
        'music-news-enhanced',
        'error',
        0,
        0,
        error.message,
        executionTime
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      executionTimeMs: executionTime,
      lastUpdated: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});