import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting AI collection analysis...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch CD collection data
    const { data: cdItems, error: cdError } = await supabaseClient
      .from('cd_scan')
      .select('artist, title, genre, year, format, label, country, discogs_url, calculated_advice_price, median_price, lowest_price, highest_price, style');

    if (cdError) {
      console.error('CD Database error:', cdError);
    }

    // Fetch vinyl collection data
    const { data: vinylItems, error: vinylError } = await supabaseClient
      .from('vinyl2_scan')
      .select('artist, title, genre, year, format, label, country, discogs_url, calculated_advice_price, median_price, lowest_price, highest_price, style');

    if (vinylError) {
      console.error('Vinyl Database error:', vinylError);
    }

    // Combine all collection items
    const allItems = [
      ...(cdItems || []).map(item => ({ ...item, source: 'cd_scan' })),
      ...(vinylItems || []).map(item => ({ ...item, source: 'vinyl2_scan' }))
    ];

    console.log(`📊 Found ${allItems.length} total items (${cdItems?.length || 0} CDs, ${vinylItems?.length || 0} vinyl)`);

    if (!allItems || allItems.length === 0) {
      console.warn('No collection items found');
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          musicPersonality: {
            profile: "🎧 Je muzikale avontuur staat op het punt te beginnen! Als een nieuwsgierige ontdekkingsreiziger sta je voor een lege wereldkaart vol muzikale schatten die nog ontdekt moeten worden.",
            traits: ["Beginnende Ontdekkingsreiziger", "Oneindige Mogelijkheden", "Muzikale Dromer"],
            musicDNA: "Een onbeschreven muzikaal verhaal wacht op de eerste noten. Jouw DNA bevat alle ingrediënten voor een epische collectie - het enige wat ontbreekt zijn de albums die jouw verhaal gaan vertellen! 🌟"
          },
          priceAnalysis: {
            marketValue: "Je collectie heeft nog geen waarde data beschikbaar.",
            investmentPotential: "Elke collectie begint met één album.",
            valueGrowthTrends: "De waarde groeit met elke toevoeging.",
            collectingStrategy: "Begin met albums die je echt raakt.",
            portfolioBreakdown: "Nog geen portfolio om te analyseren.",
            riskAssessment: "Geen risico, alleen plezier in het verzamelen."
          },
          collectionInsights: {
            uniqueness: "Elke collectie is uniek vanaf het eerste album.",
            coherence: "De rode draad zal zich vanzelf ontvouwen.",
            curation: "Kwaliteit boven kwantiteit.",
            evolution: "Elke muziekliefhebber begint ergens."
          },
          artistConnections: {
            collaborations: [],
            labelConnections: [],
            producerInsights: [],
            genreEvolution: "Je muzikale smaak zal zich ontwikkelen."
          },
          investmentInsights: {
            hiddenGems: [],
            premiumItems: [],
            trends: "Investeer in wat je leuk vindt.",
            completionOpportunities: []
          },
          culturalContext: {
            decades: [],
            movements: [],
            geography: "Wereldwijd muzikaal potentieel.",
            timeline: "Je muzikale tijdlijn begint nu."
          },
          funFacts: [
            "Elke grote collectie begint met één album",
            "De beste investeringen zijn albums waar je van houdt",
            "Muziek verbindt alle tijdperken en culturen"
          ],
          recommendations: {
            nextPurchases: ["Start met je favoriete artiest", "Ontdek een nieuw genre"],
            genreExploration: ["Rock", "Jazz", "Electronic", "Classical"],
            artistDiscovery: ["Begin met de classics"],
            collectionGaps: ["Alles is nog een mogelijkheid"]
          },
          collectionStory: "Je muzikale verhaal begint hier. Elke grote collectie start met passie en nieuwsgierigheid."
        },
        stats: { totalItems: 0, genres: [], artists: [], priceStats: { total: 0, average: 0 } },
        chartData: {
          genreDistribution: [],
          formatDistribution: [],
          topArtists: []
        },
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced creative storytelling AI prompt
    const prompt = `Je bent een charismatische muziekverteller die collecties omtovert tot boeiende levensverhalen! 🎵✨

Je specialiteit? Het ontdekken van de mens achter de muziek. Je ziet in elke LP een hoofdstuk, in elke CD een herinnering, en in elke genre een deel van iemands ziel. Je vertelt verhalen alsof je de beste vriend bent die na jaren eindelijk je platenkast mag doorsnuffelen.

Je tone of voice is:
- Warm, persoonlijk en herkenbaar Nederlands 🇳🇱
- Vol humor en speelse vergelijkingen 
- Emotioneel verbonden en oprecht geïnteresseerd
- Alsof je samen op de bank zit met een kop koffie ☕
- Een mix van kennis en enthousiasme zonder technical jargon

Analyseer deze muziekcollectie van ${allItems.length} pareltjes en vertel het verhaal achter deze muziekliefhebber:

${JSON.stringify(allItems.slice(0, 50))}

Creëer een verhaal dat laat zien wie deze persoon is aan de hand van hun muzieksmaak. Geen droge statistieken, maar échte verhalen!

BELANGRIJK: Return ALLEEN een geldig JSON object met deze structuur:

{
  "musicPersonality": {
    "profile": "Een warm, persoonlijk verhaal over wie deze muziekliefhebber is. Vertel over hun karakter, passies en wat hun muziek zegt over hun levensreis. Gebruik Nederlandse uitdrukkingen en maak het herkenbaar! 🎭",
    "traits": ["Creatieve eigenschap", "Levensstijl kenmerk", "Muzikale superpower"],
    "musicDNA": "Een poëtische beschrijving van hun unieke muzikale essentie. Wat maakt hun smaak zo bijzonder? Gebruik mooie metaforen! 🧬🎶"
  },
  "priceAnalysis": {
    "treasureHunt": "🏴‍☠️ Vertel het verhaal van hun waardevolste schatten. Welke albums zijn echte pareltjes en waarom? Maak het spannend als een schattenjacht!",
    "investmentStory": "📈 Hun collectie als investering, maar dan als verhaal. Welke albums zijn slimme zetten geweest? Wat zou een muziekbeurs-expert zeggen?",
    "marketTales": "🎪 Verhalen over hoe de muziekmarkt werkt. Waarom stijgen bepaalde albums? Wat zijn de trends? Vertel het als een avonturenverhaal!",
    "collectorWisdom": "🧙‍♂️ Verzamelaarsstrategie als wijze raad. Wat zou een oude platenbaas adviseren? Geef tips alsof je een mentor bent.",
    "portfolioStory": "🎨 Hun collectie als kunstwerk beschreven. Hoe is deze mix ontstaan? Wat zegt de balans tussen formats en genres?",
    "valueSecrets": "💎 De geheimen van waardebepaling. Waarom zijn sommige albums goud waard en andere niet? Vertel het als insider-kennis!"
  },
  "collectionInsights": {
    "uniqueMagic": "✨ Wat maakt deze collectie magisch uniek? Welke verrassende combinaties zie je?",
    "redThread": "🧵 De rode draad door hun muzikale verhaal. Hoe hangt alles samen?",
    "curationStyle": "🎯 Hun manier van verzamelen als kunstform beschreven.",
    "musicalJourney": "🗺️ Hun muzikale reis door de jaren heen als avonturenverhaal."
  },
  "artistConnections": {
    "collaborationWeb": ["Verhaal over samenwerking1", "Connectie verhaal2"],
    "labelStories": ["Label verhaal1", "Studio verhaal2"],
    "producerTales": ["Producer connectie1", "Geluidsverhaal2"],
    "genreEvolution": "🦋 Het verhaal van hoe hun smaak is geëvolueerd. Van waar naar waar en waarom?"
  },
  "investmentInsights": {
    "hiddenTreasures": ["💰 Verborgen parel verhaal1", "🔮 Toekomstige klassieker verhaal2"],
    "crownJewels": ["👑 Premium item verhaal1", "🏆 Topstuk verhaal2"],
    "marketProphecy": "🔮 Voorspellingen over waar de markt naartoe gaat, verteld als een verhaal.",
    "completionQuests": ["🗡️ Missie: ontbrekende klassieker1", "🎯 Zoektocht: serie completeren2"]
  },
  "culturalContext": {
    "timeTravel": ["1970s verhaal", "1980s verhaal"],
    "movements": ["Beweging verhaal1", "Culturele golf2"],
    "worldMap": "🌍 Een verhaal over de geografische spreiding van hun smaak.",
    "lifeTimeline": "📅 Hun leven verteld door hun muziekkeuzes."
  },
  "funFacts": [
    "🎈 Leuk feitje als verhaal1",
    "🎪 Grappige observatie2", 
    "🎭 Verrassende connectie3"
  ],
  "recommendations": {
    "nextAdventures": ["🚀 Volgende ontdekkingsreis1", "🎨 Artistieke uitbreiding2"],
    "genreExploration": ["🌟 Genre om te verkennen1", "🎵 Nieuwe richting2"],
    "artistDiscovery": ["👤 Artiest om te ontdekken1", "🎭 Muzikale soulmate2"],
    "collectionGaps": ["🕳️ Ontbrekende puzzle stuk1", "🔍 Missende link2"]
  },
  "collectionStory": "🎬 Het grote verhaal: een inspirerend, persoonlijk verhaal over deze collectie als geheel. Wie is deze muziekliefhebber? Wat is hun verhaal? Maak het als een mooie documentaire over hun muzikale leven! Gebruik emotie, herkenning en warmte. Dit moet het hoogtepunt zijn van je analyse! 🌟📖"
}

Vergeet niet: dit moet voelen als een gesprek met je beste muziekvriend die eindelijk je hele collectie mag zien! Maak het persoonlijk, warm en vol verhalen! 🎵❤️`;

    console.log('🤖 Calling OpenAI with enhanced storytelling prompt...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een charismatische muziekverteller die collecties omtovert tot boeiende levensverhalen! Je ziet in elke LP een hoofdstuk, in elke CD een herinnering. Je tone of voice is warm, persoonlijk Nederlands vol humor en speelse vergelijkingen. Alsof je samen op de bank zit met een kop koffie. Geen technische jargon, maar échte verhalen over de mens achter de muziek! Antwoord altijd in geldig JSON format zonder extra tekst.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiAnalysisText = openAIData.choices[0].message.content;
    
    console.log('📝 Raw AI response:', aiAnalysisText.substring(0, 500) + '...');

    // Parse AI response with enhanced error handling
    let analysis;
    try {
      const cleanedResponse = aiAnalysisText.trim();
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd);
      analysis = JSON.parse(jsonContent);
      
      console.log('✅ Successfully parsed AI analysis');
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      
      // Enhanced fallback analysis with storytelling approach
      const prices = allItems
        .map(item => item.calculated_advice_price || item.median_price || 0)
        .filter(price => price > 0);
      const totalValue = prices.reduce((sum, price) => sum + price, 0);
      const avgValue = prices.length > 0 ? totalValue / prices.length : 0;
      
      analysis = {
        musicPersonality: {
          profile: `🎵 Wat een indrukwekkende verzameling! Je hebt ${allItems.length} muzikale pareltjes bij elkaar gespaard, en dat zegt iets moois over jou. Je bent iemand die waarde hecht aan echte muziek, aan het fysieke bezit van je favoriete klanken. Deze collectie vertelt het verhaal van iemand die muziek niet zomaar consumeert, maar koestert. ✨`,
          traits: ["Gepassioneerde Verzamelaar", "Kwaliteitszoeker", "Muzikale Smaakmaker"],
          musicDNA: "Jouw muzikale DNA is een prachtige mix van passie en geduld. Je bouwt niet zomaar een collectie op - je creëert een soundtrack van je leven, album voor album, moment voor moment. 🧬🎶"
        },
        priceAnalysis: {
          treasureHunt: `🏴‍☠️ Je collectie van ${allItems.length} schatten heeft een geschatte waarde van €${totalValue.toFixed(2)}! Dat is gemiddeld €${avgValue.toFixed(2)} per juweeltje. Je hebt een goed oog voor waardevolle muziek - sommige van je albums zijn echte pareltjes die alleen maar in waarde zullen stijgen!`,
          investmentStory: "📈 Als investeerder ben je slim bezig geweest! Vinyl en CD's maken een comeback, en jouw collectie surft perfect mee op deze golf. De fysieke muziekmarkt groeit weer, gedreven door nostalgie en de liefde voor tastbare muziek.",
          marketTales: "🎪 De muziekwereld is vol verrassingen! Bepaalde albums worden plotseling hot omdat ze in een populaire serie voorkomen, of omdat een artiest weer trending is. Jouw collectie bevat waarschijnlijk meer verborgen schatten dan je denkt!",
          collectorWisdom: "🧙‍♂️ Een wijze verzamelaar zei ooit: 'Koop wat je hart sneller doet kloppen, niet wat de markt dicteert.' Jouw collectie ademt deze filosofie - het is een perfecte balans tussen emotionele waarde en slimme keuzes.",
          portfolioStory: `🎨 Jouw collectie is als een mooi schilderij: ${cdItems?.length || 0} CDs vormen de stevige basis, terwijl ${vinylItems?.length || 0} vinyl platen de artistieke finishing touch geven. Deze mix toont je veelzijdigheid perfect!`,
          valueSecrets: "💎 Het geheim van waardevolle muziek? Het zit hem in zeldzaamheid, conditie, en emotionele connectie. Jouw albums hebben alle drie - dat maakt ze bijzonder!"
        },
        collectionInsights: {
          uniqueMagic: "✨ Jouw collectie heeft die speciale magie die alleen echte muziekliefhebbers kunnen creëren - het is persoonlijk, doordacht, en vol verhalen.",
          redThread: "🧵 De rode draad? Kwaliteit en authenticiteit. Elk album is bewust gekozen, elk stuk heeft een reden om in jouw collectie te staan.",
          curationStyle: "🎯 Je curatieerstijl is die van een geboren verzamelaar: zorgvuldig, geduldelijk, en altijd op zoek naar die ene perfecte toevoeging.",
          musicalJourney: "🗺️ Jouw muzikale reis is nog lang niet voorbij - elke nieuwe aanwinst schrijft een nieuw hoofdstuk in je verhaal."
        },
        artistConnections: {
          collaborationWeb: ["Cross-genre magie tussen artiesten", "Onverwachte muzikale vriendschappen"],
          labelStories: ["Independent labels met karakter", "Major labels met historie"],
          producerTales: ["Legendarische producers achter de schermen", "Studio verhalen die je doen rillen"],
          genreEvolution: "🦋 Je smaak heeft zich ontwikkeld als een mooie vlinder - van cocon tot kleurenpracht, altijd groeiend en verrassend."
        },
        investmentInsights: {
          hiddenTreasures: ["Albums die nog ontdekt moeten worden", "Toekomstige classics in wording"],
          crownJewels: ["De pareltjes die je met trots toont", "Albums waar anderen jaloers op zijn"],
          marketProphecy: "🔮 De toekomst ziet er rooskleurig uit voor fysieke muziek - jouw vooruitziende blik wordt beloond!",
          completionQuests: ["Ontbrekende classics die je lijst compleet maken", "Series die om voltooiing smeken"]
        },
        culturalContext: {
          timeTravel: ["Elk decennium vertegenwoordigd", "Tijdcapsules in vinyl en CD vorm"],
          movements: ["Muzikale revoluties vastgelegd", "Culturele golven gevangen in groeven"],
          worldMap: "🌍 Je smaak reist de wereld rond - van lokale helden tot internationale sterren, een echte wereldburger!",
          lifeTimeline: "📅 Jouw leven verteld in albums - elk stuk een herinnering, elk jaar een nieuw hoofdstuk."
        },
        funFacts: [
          `🎈 Je ${allItems.length} albums vormen samen een indrukwekkende muziekbibliotheek!`,
          "🎪 De variatie in je collectie toont je brede interesse - een echte muziekliefhebber!",
          "🎭 Elke aanwinst heeft waarschijnlijk een verhaal - dat maakt je collectie zo persoonlijk!"
        ],
        recommendations: {
          nextAdventures: ["Ontdek nieuwe genres die aansluiten bij je smaak", "Verken artistieke zijwegen van je favoriete muzikanten"],
          genreExploration: ["Jazz fusion voor meer experimentele klanken", "Wereldmuziek voor nieuwe horizonten"],
          artistDiscovery: ["Ontdek de invloeden van je favoriete artiesten", "Zoek naar hedendaagse talenten in dezelfde stijl"],
          collectionGaps: ["Ontbrekende klassiekers die je lijst compleet maken", "Albums die de brug slaan tussen je genres"]
        },
        collectionStory: `🎬 Jouw collectie vertelt het verhaal van een echte muziekliefhebber. Het is niet zomaar een stapel albums - het is jouw persoonlijke soundtrack, zorgvuldig samengesteld door iemand die begrijpt dat muziek meer is dan geluid. Het is emotie, herinnering, en passie in fysieke vorm. Elke CD, elke plaat is een bewuste keuze geweest, een investering in je geluksgevoel. En dat, dat is precies wat muziek zou moeten zijn! 🌟📖🎵`
      };
    }

    const genres = [...new Set(allItems.map(item => item.genre).filter(Boolean))];
    const artists = [...new Set(allItems.map(item => item.artist).filter(Boolean))];
    
    const prices = allItems
      .map(item => item.calculated_advice_price || item.median_price || 0)
      .filter(price => price > 0);
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const avgValue = prices.length > 0 ? totalValue / prices.length : 0;

    const stats = {
      totalItems: allItems.length,
      genres,
      artists,
      priceStats: {
        total: totalValue,
        average: avgValue,
        itemsWithPricing: prices.length,
        cdCount: cdItems?.length || 0,
        vinylCount: vinylItems?.length || 0
      }
    };

    const genreDistribution = genres.map(genre => ({
      name: genre,
      value: allItems.filter(item => item.genre === genre).length,
      percentage: Math.round((allItems.filter(item => item.genre === genre).length / allItems.length) * 100)
    }));

    const formatDistribution = [
      { name: "CD", value: cdItems?.length || 0, fill: "#6B7280" },
      { name: "Vinyl", value: vinylItems?.length || 0, fill: "#9CA3AF" }
    ].filter(item => item.value > 0);

    const topArtists = Object.entries(
      allItems.reduce((acc, item) => {
        if (item.artist) {
          acc[item.artist] = (acc[item.artist] || 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, albums]) => ({ name, albums }));

    const chartData = {
      genreDistribution,
      formatDistribution,
      topArtists,
      priceByDecade: [],
      valueByGenre: genres.map(genre => {
        const genreItems = allItems.filter(item => item.genre === genre);
        const genrePrices = genreItems
          .map(item => item.calculated_advice_price || item.median_price || 0)
          .filter(price => price > 0);
        const avgPrice = genrePrices.length > 0 ? genrePrices.reduce((sum, price) => sum + price, 0) / genrePrices.length : 0;
        return {
          genre,
          avgPrice,
          count: genreItems.length,
          totalValue: genrePrices.reduce((sum, price) => sum + price, 0)
        };
      })
    };

    console.log('✅ AI analysis completed successfully with enhanced storytelling');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      stats,
      chartData,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Collection AI analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
