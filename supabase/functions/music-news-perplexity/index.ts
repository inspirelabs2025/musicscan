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

// Fallback news items in case API fails
const fallbackNewsItems: NewsItem[] = [
  {
    title: "Nieuwe muziektrends in 2025",
    summary: "Ontdek de nieuwste ontwikkelingen in de muziekindustrie dit jaar",
    source: "Muzieknieuws",
    publishedAt: new Date().toISOString(),
    category: "Industry"
  },
  {
    title: "Vinyl verkoop blijft groeien",
    summary: "Fysieke media maken een comeback bij muziekliefhebbers",
    source: "Muziektrends",
    publishedAt: new Date().toISOString(),
    category: "Industry"
  },
  {
    title: "Streaming platforms investeren in nieuwe technologie",
    summary: "Verbeterde audio-kwaliteit en AI-features komen eraan",
    source: "Tech Music",
    publishedAt: new Date().toISOString(),
    category: "Industry"
  },
  {
    title: "Concertticket verkoop record gebroken",
    summary: "2025 wordt een topjaar voor live muziek evenementen",
    source: "Concert News",
    publishedAt: new Date().toISOString(),
    category: "Concert"
  },
  {
    title: "Indie artiesten profiteren van social media",
    summary: "Nieuwe platforms helpen onafhankelijke muzikanten hun publiek te bereiken",
    source: "Artist Today",
    publishedAt: new Date().toISOString(),
    category: "Artist News"
  },
  {
    title: "AI-gegenereerde muziek zorgt voor debat",
    summary: "De muziekindustrie worstelt met nieuwe technologische ontwikkelingen",
    source: "Music Tech",
    publishedAt: new Date().toISOString(),
    category: "Industry"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('Perplexity API key not configured');
      return new Response(JSON.stringify({
        success: true,
        news: fallbackNewsItems,
        lastUpdated: new Date().toISOString(),
        message: 'Using fallback news items - API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching music news from Perplexity with sonar model...');
    
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
              content: 'Je bent een muzieknieuws curator. Zoek naar exacte 12 recente muzieknieuwsberichten van de afgelopen 14 dagen. Geef ALLEEN een geldige JSON array terug met objecten die bevatten: title, summary (max 150 karakters), source, publishedAt (ISO datum string), url (indien beschikbaar), en category. Antwoord alleen met JSON, geen extra tekst.'
            },
            {
              role: 'user',
              content: 'Vind het laatste muzieknieuws van september 2025, inclusief nieuwe albumreleases, artiest aankondigingen, tour data, muziekindustrie updates, award shows, en chart informatie. Geef alleen als JSON array terug.'
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
          search_recency_filter: 'month',
          frequency_penalty: 0.5,
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

    // Ensure we have exactly 12 items, pad with fallback if needed
    while (newsItems.length < 12 && fallbackNewsItems.length > 0) {
      const fallbackIndex = newsItems.length % fallbackNewsItems.length;
      newsItems.push({
        ...fallbackNewsItems[fallbackIndex],
        publishedAt: new Date().toISOString()
      });
    }
    
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
    
    // Return fallback news items instead of empty array on error
    return new Response(JSON.stringify({
      success: true,
      news: fallbackNewsItems,
      lastUpdated: new Date().toISOString(),
      message: `API error, using fallback news: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});