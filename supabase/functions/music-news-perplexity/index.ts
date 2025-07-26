import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url?: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    console.log('Fetching music news from Perplexity...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-7b-online',
        messages: [
          {
            role: 'system',
            content: 'You are a music news curator. Provide exactly 12 recent music news items in JSON format with title, summary (max 150 chars), source, publishedAt (ISO date), url, and category fields. Focus on album releases, artist news, concert announcements, and industry updates from the last 14 days. Include diverse categories like "Album Release", "Artist News", "Concert", "Industry", "Awards", "Chart News".'
          },
          {
            role: 'user',
            content: 'Get the latest 12 music news items from the past 2 weeks, including new album releases, artist announcements, concert news, industry updates, and chart news. Return as JSON array with diverse categories.'
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1500,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'week',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Perplexity error response:', errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response received:', data);
    const content = data.choices[0].message.content;
    
    let newsItems: NewsItem[] = [];
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured news from text
        newsItems = [{
          title: "Music News Update",
          summary: "Latest music industry news and releases",
          source: "Perplexity",
          publishedAt: new Date().toISOString(),
          category: "General"
        }];
      }
    } catch (parseError) {
      console.log('Failed to parse JSON, using fallback news items');
      newsItems = [{
        title: "Music Industry Updates",
        summary: "Stay tuned for the latest music news and album releases",
        source: "Music News",
        publishedAt: new Date().toISOString(),
        category: "Industry"
      }];
    }

    // Ensure we have exactly 12 items
    newsItems = newsItems.slice(0, 12);

    console.log(`Fetched ${newsItems.length} music news items from Perplexity`);

    return new Response(JSON.stringify({
      success: true,
      news: newsItems,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching music news:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      news: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});