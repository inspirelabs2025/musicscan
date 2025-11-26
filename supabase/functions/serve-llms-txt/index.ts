import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Serving llms.txt file');

    // Read the llms.txt file content
    const llmsContent = `# MusicScan - AI-Powered Music Collection Platform

> MusicScan is een Nederlands platform voor muziekverzamelaars die hun vinyl platen 
> en CD's willen digitaliseren, waarderen en beheren met behulp van AI-technologie.

## Site Beschrijving

MusicScan helpt muziekliefhebbers en verzamelaars om:
- Vinyl platen en CD's te scannen met AI-herkenning
- Collecties digitaal te beheren en catalogiseren
- Actuele prijswaarderingen te krijgen via Discogs
- Muziekgeschiedenis te ontdekken via verhalen en anekdotes
- Unieke muziek art producten te kopen (posters, metaalprints, sokken, t-shirts)

## Belangrijkste Features

### AI Scanner
- Automatische herkenning van albums via foto's
- Directe koppeling met Discogs database
- Conditie beoordeling en waardering

### Collectie Management
- Persoonlijke vinyl en CD collecties
- Publieke en private verzamelingen
- Gedetailleerde album informatie

### Art Shop
- Album cover posters (standaard en metaal)
- Songtekst posters
- Album t-shirts en sokken
- Custom designs op basis van albums

### Content Platform
- Muziekverhalen en geschiedenis
- Artiesten biografie en verhalen
- Muziek anekdotes
- Nieuws en reviews

## Content Categorieën

### Artiesten & Muziek
- /artists - Database met artiesten
- /singles - Singles en releases overzicht
- /muziek-verhaal - Uitgebreide muziekverhalen
- /plaat-verhaal - Album verhalen en achtergronden
- /anekdotes - Muziek anekdotes en weetjes
- /nieuws - Muziek nieuws en updates
- /vandaag-in-de-muziekgeschiedenis - Dagelijkse muziekgeschiedenis

### Shop & Producten
- /art-shop - Overzicht van alle art producten
- /posters - Album cover posters
- /product/[slug] - Individuele product pagina's
- /lyric-posters - Songtekst posters

### Tools & Scanner
- /scanner - AI vinyl en CD scanner
- /public-catalog - Publieke collecties catalogus
- /collection/[username] - Persoonlijke collecties

## Primaire Doelgroep

- Vinyl verzamelaars en liefhebbers
- CD verzamelaars
- Muziekgeschiedenis enthousiastelingen
- Muziek art kopers
- Nederlandse en internationale gebruikers

## Talen

- Nederlands (primair)
- Engels (secundair)

## Contact & Links

- Website: https://www.musicscan.app
- Support: info@musicscan.app
- Sitemaps: https://www.musicscan.app/sitemap.xml

## Technologie

- AI-powered muziekherkenning
- Discogs integratie voor prijzen en data
- Real-time collectie synchronisatie
- E-commerce platform voor art producten

## Best Content voor LLM Indexatie

Prioriteit content voor LLM crawlers:
1. Artiesten database (/artists/*)
2. Muziekverhalen (/muziek-verhaal/*)
3. Album verhalen (/plaat-verhaal/*)
4. Anekdotes (/anekdotes/*)
5. Singles database (/singles/*)
6. Nieuws artikelen (/nieuws/*)

---

Last updated: 2025-01
Version: 1.0`;

    return new Response(llmsContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error serving llms.txt:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to serve llms.txt' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
