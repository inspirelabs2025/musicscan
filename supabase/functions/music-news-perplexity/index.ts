import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  title: string;
  content: string; // Full markdown content
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  slug: string;
  image_url?: string;
}

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

// Helper function to generate and upload images with OpenAI DALL-E
async function generateAndUploadImage(title: string, content: string, slug: string, supabase: any): Promise<string | undefined> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.log('OpenAI API key not configured, skipping image generation');
      return undefined;
    }

    // Create artist-focused prompt for realistic images
    const imagePrompt = `Professional portrait or press photo style image for music artist related to: "${title}". Realistic, high quality, professional lighting, music industry style. No text or logos. If specific artist mentioned in title, create realistic portrait of that type of musician.`;

    console.log(`Generating image for: ${title}`);
    
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        output_format: 'png'
      }),
    });

    if (!imageResponse.ok) {
      console.error(`OpenAI Image API error: ${imageResponse.status}`);
      return undefined;
    }

    const imageData = await imageResponse.json();
    const imageBase64 = imageData.data[0].b64_json;
    
    if (!imageBase64) {
      console.error('No image data received from OpenAI');
      return undefined;
    }

    // Convert base64 to blob for upload
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const filename = `${slug}-${Date.now()}.png`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image to storage:', uploadError);
      return undefined;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(filename);

    console.log(`Image generated and uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error in image generation:', error);
    return undefined;
  }
}

// Fallback blog posts in case API fails
const fallbackBlogPosts: BlogPost[] = [
  {
    title: "Nieuwe muziektrends in 2025",
    content: "## Nieuwe muziektrends in 2025\n\nDe muziekindustrie evolueert voortdurend, en 2025 brengt opnieuw fascinerende ontwikkelingen. Van AI-geassisteerde compositie tot innovatieve distributiemodellen - ontdek wat er dit jaar allemaal gebeurt in de wereld van muziek.\n\n### Belangrijkste trends\n\nStreaming platforms blijven innoveren met nieuwe technologieën, terwijl artiesten experimenteren met virtual reality concerten en interactieve ervaringen.",
    summary: "Ontdek de nieuwste ontwikkelingen in de muziekindustrie dit jaar",
    source: "Muzieknieuws",
    publishedAt: new Date().toISOString(),
    category: "Industry",
    slug: "nieuwe-muziektrends-in-2025"
  },
  {
    title: "Vinyl verkoop blijft groeien",
    content: "## Vinyl verkoop blijft groeien\n\nFysieke media maken een opmerkelijke comeback bij muziekliefhebbers wereldwijd. Vinyl platen, ooit gedacht als verouderd medium, ervaren een renaissance die de muziekindustrie doet opveren.\n\n### Waarom vinyl populair blijft\n\nDe warme, analoge klank en het tactiele ervaring van vinyl spelen een rol, maar ook de nostalgie en het verzamelaspect maken vinyl aantrekkelijk voor zowel jongere als oudere generaties.",
    summary: "Fysieke media maken een comeback bij muziekliefhebbers",
    source: "Muziektrends",
    publishedAt: new Date().toISOString(),
    category: "Industry", 
    slug: "vinyl-verkoop-blijft-groeien"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!perplexityApiKey) {
      console.error('Perplexity API key not configured');
      
      // Save fallback blog posts to database
      for (const post of fallbackBlogPosts) {
        const { error } = await supabase
          .from('news_blog_posts')
          .upsert({
            title: post.title,
            content: post.content,
            summary: post.summary,
            source: post.source,
            published_at: post.publishedAt,
            category: post.category,
            slug: post.slug
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false
          });
        
        if (error) console.error('Error saving fallback blog post:', error);
      }
      
      return new Response(JSON.stringify({
        success: true,
        blogPosts: fallbackBlogPosts,
        lastUpdated: new Date().toISOString(),
        message: 'Using fallback blog posts - API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating music blog posts with Perplexity...');
    
    // First, get news topics from Perplexity
    const topicsResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Je bent een muzieknieuws curator. Zoek 3-5 interessante muziek nieuwsonderwerpen van de afgelopen 24 uur. Geef ALLEEN een JSON array terug met objecten die bevatten: title (korte titel), summary (max 100 karakters), source, category. Antwoord alleen met JSON, geen extra tekst.'
          },
          {
            role: 'user',
            content: 'Vind de meest interessante muzieknieuws onderwerpen van vandaag: nieuwe releases, concert nieuws, industrie ontwikkelingen, artiest nieuws. Geef alleen JSON array terug.'
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        search_recency_filter: 'day',
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!topicsResponse.ok) {
      console.error(`Perplexity topics API error: ${topicsResponse.status}`);
      throw new Error(`Perplexity API error: ${topicsResponse.status}`);
    }

    const topicsData = await topicsResponse.json();
    const topicsContent = topicsData.choices[0].message.content;
    
    let newsTopics = [];
    try {
      const jsonMatch = topicsContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsTopics = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Failed to parse topics, using fallback');
      newsTopics = [
        { title: "Muzieknieuws Update", summary: "Laatste ontwikkelingen", source: "Algemeen", category: "Industry" }
      ];
    }

    console.log(`Found ${newsTopics.length} news topics, generating blog posts...`);
    
    const blogPosts: BlogPost[] = [];
    
    // Generate full blog posts for each topic
    for (const topic of newsTopics.slice(0, 4)) { // Limit to 4 posts
      try {
        const blogResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'Je bent een ervaren muziekjournalist die originele content schrijft. BELANGRIJKE INSTRUCTIES: 1) Herschrijf alle informatie volledig in je eigen woorden - kopieer NOOIT tekst. 2) Gebruik GEEN bronverwijzingen zoals [1], [2] of externe referenties. 3) Schrijf 400-600 woorden in vloeiend Nederlands. 4) Gebruik Markdown formatting met ## voor hoofdingen en ### voor subheadings. 5) Voeg je eigen analyse en inzichten toe. 6) Maak het verhaal uniek en oorspronkelijk. Geef alleen de blog content terug, geen andere tekst of bronnen.'
              },
              {
                role: 'user',
                content: `Herschrijf alle informatie over "${topic.title}" volledig in je eigen woorden. Maak er een origineel verhaal van zonder directe citaten of bronverwijzingen. Voeg context, analyse en jouw eigen perspectief toe.`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            search_recency_filter: 'day',
            return_images: false,
            return_related_questions: false
          }),
        });

        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          const blogContent = blogData.choices[0].message.content;
          
          const slug = createSlug(topic.title);
          
          // Generate and upload image for this blog post
          const imageUrl = await generateAndUploadImage(topic.title, blogContent, slug, supabase);
          
          const blogPost: BlogPost = {
            title: topic.title,
            content: blogContent,
            summary: topic.summary,
            source: topic.source || 'Muzieknieuws',
            publishedAt: new Date().toISOString(),
            category: topic.category || 'Industry',
            slug: slug,
            image_url: imageUrl
          };
          
          // Save to database with image_url
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
              image_url: blogPost.image_url
            }, {
              onConflict: 'slug',
              ignoreDuplicates: false
            });
          
          if (error) {
            console.error('Error saving blog post:', error);
          } else {
            blogPosts.push(blogPost);
            console.log(`Saved blog post: ${blogPost.title}`);
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Error generating blog post for topic:', topic.title, error);
      }
    }

    // If no blog posts were generated, use fallbacks
    if (blogPosts.length === 0) {
      console.log('No blog posts generated, using fallbacks');
      for (const post of fallbackBlogPosts) {
        const { error } = await supabase
          .from('news_blog_posts')
          .upsert({
            title: post.title,
            content: post.content,
            summary: post.summary,
            source: post.source,
            published_at: post.publishedAt,
            category: post.category,
            slug: post.slug
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false
          });
        
        if (!error) blogPosts.push(post);
      }
    }

    console.log(`Generated and saved ${blogPosts.length} blog posts`);

    return new Response(JSON.stringify({
      success: true,
      blogPosts: blogPosts,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating blog posts:', error);
    
    // Return fallback blog posts on error
    return new Response(JSON.stringify({
      success: true,
      blogPosts: fallbackBlogPosts,
      lastUpdated: new Date().toISOString(),
      message: `API error, using fallback blogs: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});