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

// Nederlandse muzieknieuwssites RSS feeds
const RSS_FEEDS = [
  { url: 'https://3voor12.vpro.nl/feed.xml', source: '3voor12', category: 'Algemeen' },
  { url: 'https://www.musicmaker.nl/feed/', source: 'Musicmaker', category: 'Industry' },
  { url: 'https://feeds.feedburner.com/oor-magazine', source: 'Oor Magazine', category: 'Reviews' },
  { url: 'https://maxazine.nl/feed/', source: 'Maxazine', category: 'Concert nieuws' },
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

// Check if a date is within the last 2 days
function isRecentDate(dateString: string): boolean {
  try {
    const itemDate = new Date(dateString);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    return itemDate >= twoDaysAgo && itemDate <= new Date();
  } catch {
    return false;
  }
}

// Extract date from text content
function extractDateFromText(text: string): Date | null {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check for Dutch date keywords
  if (text.toLowerCase().includes('vandaag') || text.toLowerCase().includes('today')) {
    return today;
  }
  if (text.toLowerCase().includes('gisteren') || text.toLowerCase().includes('yesterday')) {
    return yesterday;
  }
  
  // Look for date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (isRecentDate(date.toISOString())) {
          return date;
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

// Parse RSS feed with improved error handling
async function parseRSSFeed(feedUrl: string, source: string, category: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS feed: ${feedUrl}`);
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MuziekNieuwsBot/1.0)',
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch RSS feed ${feedUrl}: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSItem[] = [];
    
    // Enhanced XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
    
    if (itemMatches) {
      for (const itemXml of itemMatches.slice(0, 15)) {
        try {
          const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
          const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i);
          const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
          const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
          
          if (titleMatch && linkMatch && pubDateMatch) {
            const title = (titleMatch[1] || '').replace(/<[^>]+>/g, '').trim();
            const pubDate = pubDateMatch[1].trim();
            const description = (descMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();
            
            // Enhanced date validation
            if (isRecentDate(pubDate) || extractDateFromText(title + ' ' + description)) {
              items.push({
                title,
                link: linkMatch[1].trim(),
                pubDate,
                description: description.substring(0, 200) + '...',
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
    
    console.log(`Found ${items.length} recent items from ${source}`);
    return items;
    
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
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
    
    // Additional similarity check
    if (data && data.length > 0) {
      for (const existing of data) {
        const similarity = calculateSimilarity(title.toLowerCase(), existing.title.toLowerCase());
        if (similarity > 0.7) {
          console.log(`High similarity detected: ${similarity.toFixed(2)} - ${title}`);
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

// Enhanced content generation with strict validation
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
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `Je bent een Nederlandse muziekjournalist die schrijft voor een moderne muziekblog. Vandaag is ${currentDate}.

KRITIEKE INSTRUCTIES:
- Schrijf ALLEEN over recent muzieknieuws (laatste 48 uur)
- Als informatie ouder is dan 2 dagen, antwoord met "OUTDATED_CONTENT"
- Gebruik GEEN externe referenties of bronverwijzingen 
- Schrijf 300-500 woorden in vloeiend Nederlands
- Gebruik Markdown met ## voor hoofdingen, ### voor subheadings
- Voeg context, achtergrond en eigen journalistieke analyse toe
- Maak het verhaal interessant en informatief
- Controleer actualiteit van de informatie`
          },
          {
            role: 'user',
            content: `Schrijf een origineel nieuwsartikel over: "${topic}"
            
Context: ${description}
Bron: ${source}

CONTROLEER EERST: Is dit nieuws van de laatste 2 dagen? Zo niet, antwoord met "OUTDATED_CONTENT".

Als het wel recent is, schrijf dan een volledig artikel met:
- Nieuws samenvatting en belangrijkste punten
- Relevante achtergrond en context  
- Analyse van betekenis voor de muziekwereld
- Eigen journalistieke inzichten
- Geen citaten of externe bronnen`
          }
        ],
        temperature: 0.5,
        max_tokens: 1200,
        search_recency_filter: 'day',
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Strict content validation
    if (content.includes('OUTDATED_CONTENT') || 
        content.includes('oude nieuws') || 
        content.includes('niet recent') ||
        content.includes('meer dan') && content.includes('dagen geleden')) {
      console.log(`Filtering outdated content: ${topic}`);
      return null;
    }
    
    // Additional validation for content quality
    if (content.length < 200) {
      console.log(`Content too short for: ${topic}`);
      return null;
    }
    
    return content;
    
  } catch (error) {
    console.error('Error generating enhanced content:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🎵 Starting enhanced Dutch music news generation...');
    
    // Step 1: Fetch from multiple Dutch RSS feeds
    console.log('📡 Fetching Dutch music RSS feeds...');
    const allRSSItems: RSSItem[] = [];
    
    for (const feed of RSS_FEEDS) {
      try {
        const items = await parseRSSFeed(feed.url, feed.source, feed.category);
        allRSSItems.push(...items);
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to fetch ${feed.source}:`, error);
      }
    }
    
    console.log(`📰 Found ${allRSSItems.length} total recent RSS items`);
    
    // Step 2: Sort by recency and relevance
    const sortedItems = allRSSItems
      .filter(item => item.title.length > 10)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 8); // Take top 8 most recent
    
    // Step 3: Process and generate enhanced blog posts
    const blogPosts: BlogPost[] = [];
    const processedTitles = new Set<string>();
    
    for (const item of sortedItems) {
      try {
        const slug = createSlug(item.title);
        const titleKey = item.title.toLowerCase().substring(0, 40);
        
        // Skip if already processed similar title
        if (processedTitles.has(titleKey)) {
          console.log(`Skipping similar title: ${item.title}`);
          continue;
        }
        processedTitles.add(titleKey);
        
        // Check for duplicates in database
        const isDuplicate = await isDuplicatePost(supabase, item.title, slug);
        if (isDuplicate) {
          console.log(`Skipping duplicate: ${item.title}`);
          continue;
        }
        
        // Generate enhanced content
        let content = `## ${item.title}\n\n${item.description}`;
        
        if (perplexityApiKey) {
          const enhancedContent = await generateEnhancedContent(
            item.title, 
            item.description, 
            item.source, 
            perplexityApiKey
          );
          
          if (enhancedContent) {
            content = enhancedContent;
          } else {
            console.log(`Skipping due to content validation: ${item.title}`);
            continue;
          }
        }
        
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
          console.log(`✅ Saved: ${blogPost.title} (${blogPost.source})`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Stop after 4 successful posts
        if (blogPosts.length >= 4) break;
        
      } catch (error) {
        console.error(`Error processing RSS item: ${item.title}`, error);
        continue;
      }
    }
    
    console.log(`🎉 Enhanced music news generation completed: ${blogPosts.length} posts created`);

    return new Response(JSON.stringify({
      success: true,
      blogPosts: blogPosts,
      rssItemsProcessed: sortedItems.length,
      totalRssItemsFound: allRSSItems.length,
      lastUpdated: new Date().toISOString(),
      message: `Generated ${blogPosts.length} enhanced Dutch music news posts`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in enhanced music news generation:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      lastUpdated: new Date().toISOString(),
      message: 'Enhanced music news generation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});