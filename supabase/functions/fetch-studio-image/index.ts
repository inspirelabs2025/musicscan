import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded verified Wikipedia/Wikimedia Commons images for famous studios
const studioImageMap: { [key: string]: string } = {
  'abbey road': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Abbey_Road_Studios.jpg/1280px-Abbey_Road_Studios.jpg',
  'trident': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/17_St_Anne%27s_Court.jpg/800px-17_St_Anne%27s_Court.jpg',
  'sun studio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sun_Studio_2014.jpg/1280px-Sun_Studio_2014.jpg',
  'electric lady': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Electric_Lady_Studios.jpg/1280px-Electric_Lady_Studios.jpg',
  'hansa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Berlin_hansa_studios.jpg/1280px-Berlin_hansa_studios.jpg',
  'muscle shoals': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/FAME_Studios.jpg/1280px-FAME_Studios.jpg',
  'fame': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/FAME_Studios.jpg/1280px-FAME_Studios.jpg',
  'capitol': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Capitol_Records_Building_LA.jpg/800px-Capitol_Records_Building_LA.jpg',
  'motown': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hitsville_USA.jpg/1280px-Hitsville_USA.jpg',
  'hitsville': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hitsville_USA.jpg/1280px-Hitsville_USA.jpg',
  'sound city': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sound_City_Studios.jpg/1280px-Sound_City_Studios.jpg',
  'olympic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Olympic_Sound_Studios.jpg/800px-Olympic_Sound_Studios.jpg',
  'record plant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Record_Plant_NYC.jpg/800px-Record_Plant_NYC.jpg',
  'criteria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Criteria_Recording_Studios.jpg/1280px-Criteria_Recording_Studios.jpg',
  'rockfield': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rockfield_Studios.jpg/1280px-Rockfield_Studios.jpg',
  'sunset sound': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Sunset_Sound_Recorders.jpg/1280px-Sunset_Sound_Recorders.jpg',
  'power station': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Power_Station_at_BerkleeNYC.jpg/1024px-Power_Station_at_BerkleeNYC.jpg',
  'ocean way': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Ocean_Way_Recording.jpg/1280px-Ocean_Way_Recording.jpg',
  'air': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/AIR_Studios.jpg/1280px-AIR_Studios.jpg',
  'rak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/RAK_Studios.jpg/1280px-RAK_Studios.jpg',
  'sterling sound': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Sterling_Sound_NY.jpg/1024px-Sterling_Sound_NY.jpg',
  'conny': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Conny_Plank_Studio.jpg/1024px-Conny_Plank_Studio.jpg',
  'wisseloord': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Wisseloord_Studios.jpg/1280px-Wisseloord_Studios.jpg',
  'polar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Polar_Music_Studio.jpg/1024px-Polar_Music_Studio.jpg',
  'compass point': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Compass_Point_Studios.jpg/1024px-Compass_Point_Studios.jpg',
  'village': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Village_Recorder.jpg/1024px-Village_Recorder.jpg',
  'a&m': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/A%26M_Records_studio.jpg/1280px-A%26M_Records_studio.jpg',
  'cherokee': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Cherokee_Studios_LA.jpg/1024px-Cherokee_Studios_LA.jpg',
  'sigma sound': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Sigma_Sound_Studios.jpg/1024px-Sigma_Sound_Studios.jpg',
  'stax': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Stax_Museum_Memphis.jpg/1280px-Stax_Museum_Memphis.jpg',
  'rca studio b': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/RCA_Studio_B_Nashville.jpg/1280px-RCA_Studio_B_Nashville.jpg',
  'chess': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Chess_Records_Building.jpg/1024px-Chess_Records_Building.jpg',
  'j&m': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/J%26M_Recording_Studio.jpg/1024px-J%26M_Recording_Studio.jpg',
  'gold star': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Gold_Star_Studios.jpg/1024px-Gold_Star_Studios.jpg',
  'decca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Decca_Studios_London.jpg/1024px-Decca_Studios_London.jpg',
  'metropolis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Metropolis_Studios.jpg/1280px-Metropolis_Studios.jpg',
  'studio bernaerts': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sound_recording_studio.jpg/1024px-Sound_recording_studio.jpg',
};

// Fetch image from Wikipedia API for studios not in the hardcoded map
async function fetchWikipediaImage(studioName: string): Promise<string | null> {
  try {
    const userAgent = 'MusicScan/1.0 (https://musicscan.app; info@musicscan.app)';

    const getLargerImage = (url: string) => {
      // Common Wikimedia thumb URLs include: /thumb/.../800px-Filename.jpg
      // If we can find a "{number}px-" segment, upgrade it.
      if (/\/\d+px-/.test(url)) return url.replace(/\/\d+px-/, '/1280px-');
      return url;
    };

    const fetchSummary = async (title: string) => {
      const encodedTitle = encodeURIComponent(title);
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;
      const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
      if (!res.ok) return null;
      return await res.json();
    };

    const searchTitle = async (term: string) => {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        term
      )}&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
      if (!res.ok) return null;
      const data = await res.json();
      const firstTitle = data?.query?.search?.[0]?.title;
      return typeof firstTitle === 'string' ? firstTitle : null;
    };

    // Try variations of the studio name
    const searchTerms = [
      `${studioName} recording studio`,
      `${studioName} studios`,
      studioName,
    ];

    for (const term of searchTerms) {
      // 1) Try direct summary lookup (works when term matches page title)
      const direct = await fetchSummary(term);
      const directImg = direct?.originalimage?.source || direct?.thumbnail?.source;
      if (directImg) {
        const finalUrl = getLargerImage(direct?.originalimage?.source || directImg);
        console.log(`✅ Found Wikipedia image for "${studioName}" (direct): ${finalUrl}`);
        return finalUrl;
      }

      // 2) Fallback: use Wikipedia search API to find the best-matching page
      const title = await searchTitle(term);
      if (!title) continue;

      const summary = await fetchSummary(title);
      const img = summary?.originalimage?.source || summary?.thumbnail?.source;
      if (img) {
        const finalUrl = getLargerImage(summary?.originalimage?.source || img);
        console.log(`✅ Found Wikipedia image for "${studioName}" via search "${term}": ${finalUrl}`);
        return finalUrl;
      }
    }

    console.log(`⚠️ No Wikipedia image found for: ${studioName}`);
    return null;
  } catch (error) {
    console.error(`Error fetching Wikipedia image for ${studioName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studioName } = await req.json();

    if (!studioName) {
      throw new Error('Studio naam is verplicht');
    }

    console.log(`🖼️ Fetching image for studio: ${studioName}`);

    // Check hardcoded map first
    const studioLower = studioName.toLowerCase();
    for (const [key, imageUrl] of Object.entries(studioImageMap)) {
      if (studioLower.includes(key)) {
        console.log(`✅ Found hardcoded image for ${studioName}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl,
            source: 'hardcoded'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Try Wikipedia API
    const wikipediaImage = await fetchWikipediaImage(studioName);
    
    if (wikipediaImage) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: wikipediaImage,
          source: 'wikipedia'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return a generic recording studio placeholder
    const placeholderUrl = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&q=80';
    
    console.log(`📷 Using placeholder image for: ${studioName}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: placeholderUrl,
        source: 'placeholder'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error fetching studio image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
