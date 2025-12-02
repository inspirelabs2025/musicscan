import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizeFullUrl } from '@/lib/utils';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  canonicalUrl?: string;
}

const DEFAULT_SEO: SEOData = {
  title: 'MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner',
  description: 'MusicScan is hét complete muziekplatform. Muzieknieuws, verhalen over albums & artiesten, unieke muziekproducten shop, muziek quiz, vandaag in de muziekgeschiedenis, en smart scanner voor vinyl & CD collectie met waardebepaling. Alles voor muziekliefhebbers!',
  keywords: 'muziekplatform, muzieknieuws, album verhalen, artiesten verhalen, muziek shop, vinyl scanner, CD scanner, muziek quiz, muziek collectie, waardebepaling, muziek blog, muziek merchandise, vandaag in de muziekgeschiedenis',
  image: '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
  type: 'website',
  siteName: 'MusicScan',
  locale: 'nl_NL',
};

export const useSEO = (seoData?: Partial<SEOData>) => {
  const location = useLocation();
  
  useEffect(() => {
    const finalSEO = { ...DEFAULT_SEO, ...seoData };
    const currentUrl = normalizeFullUrl(location.pathname);
    
    // Update document title
    document.title = finalSEO.title || DEFAULT_SEO.title!;
    
    // Helper function to update meta tag
    const updateMetaTag = (name: string, content: string, useProperty = false) => {
      const attribute = useProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // Update meta tags
    updateMetaTag('description', finalSEO.description!);
    updateMetaTag('keywords', finalSEO.keywords!);
    
    // Open Graph tags
    updateMetaTag('og:title', finalSEO.title!, true);
    updateMetaTag('og:description', finalSEO.description!, true);
    updateMetaTag('og:image', finalSEO.image || DEFAULT_SEO.image!, true);
    updateMetaTag('og:url', finalSEO.canonicalUrl || currentUrl, true);
    updateMetaTag('og:type', finalSEO.type || DEFAULT_SEO.type!, true);
    updateMetaTag('og:site_name', finalSEO.siteName || DEFAULT_SEO.siteName!, true);
    updateMetaTag('og:locale', finalSEO.locale || DEFAULT_SEO.locale!, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', finalSEO.title!);
    updateMetaTag('twitter:description', finalSEO.description!);
    updateMetaTag('twitter:image', finalSEO.image || DEFAULT_SEO.image!);
    updateMetaTag('twitter:site', '@musicscan_app');
    updateMetaTag('twitter:creator', '@musicscan_app');
    
    // Additional SEO meta tags
    updateMetaTag('author', 'MusicScan');
    updateMetaTag('application-name', 'MusicScan');
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalSEO.canonicalUrl || currentUrl);
    
    // Language alternate (only nl for now, remove en variant until implemented)
    let hreflangNL = document.querySelector('link[hreflang="nl"]');
    if (!hreflangNL) {
      hreflangNL = document.createElement('link');
      hreflangNL.setAttribute('rel', 'alternate');
      hreflangNL.setAttribute('hreflang', 'nl');
      document.head.appendChild(hreflangNL);
    }
    hreflangNL.setAttribute('href', currentUrl);
    
    // x-default hreflang for international targeting
    let hreflangDefault = document.querySelector('link[hreflang="x-default"]');
    if (!hreflangDefault) {
      hreflangDefault = document.createElement('link');
      hreflangDefault.setAttribute('rel', 'alternate');
      hreflangDefault.setAttribute('hreflang', 'x-default');
      document.head.appendChild(hreflangDefault);
    }
    hreflangDefault.setAttribute('href', currentUrl);
    
  }, [
    location.pathname,
    seoData?.title,
    seoData?.description,
    seoData?.keywords,
    seoData?.image,
    seoData?.canonicalUrl,
    seoData?.type,
    seoData?.siteName,
    seoData?.locale
  ]);
};

// Route-specific SEO configurations
export const SEO_CONFIGS = {
  '/': {
    title: 'MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner',
    description: 'MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.',
    keywords: 'muziekplatform, muzieknieuws, album verhalen, artiesten, muziek shop, vinyl scanner, muziek quiz, waardebepaling'
  },
  '/verhalen': {
    title: 'Muziekverhalen - Albums, Artiesten & Singles | MusicScan',
    description: 'Ontdek de verhalen achter je favoriete albums, artiesten en singles. Achtergrondinformatie, geschiedenis en bijzondere details over muziek.',
    keywords: 'muziekverhalen, album verhalen, artiest verhalen, singles verhalen, muziek geschiedenis, album achtergrondinformatie'
  },
  '/nieuws': {
    title: 'Muzieknieuws - Het Laatste Nieuws uit de Muziekwereld | MusicScan',
    description: 'Blijf op de hoogte van het laatste muzieknieuws. Nieuwe releases, concerten, albumreviews en alles wat speelt in de muziekwereld.',
    keywords: 'muzieknieuws, nieuwe releases, concert nieuws, album reviews, muziek actualiteit'
  },
  '/quiz': {
    title: 'Muziek Quiz - Test Je Kennis | MusicScan',
    description: 'Test je muziekkennis met onze interactieve quiz. Ontdek hoeveel je weet over albums, artiesten en muziekgeschiedenis.',
    keywords: 'muziek quiz, muziekkennis test, album quiz, artiesten quiz'
  },
  '/vandaag-in-de-muziekgeschiedenis': {
    title: 'Vandaag in de Muziekgeschiedenis | MusicScan',
    description: 'Ontdek welke muzikale gebeurtenissen vandaag in de geschiedenis plaatsvonden. Releases, concerten, geboortes en mijlpalen.',
    keywords: 'vandaag in de muziekgeschiedenis, muziek kalender, historische muziek gebeurtenissen'
  },
  '/anekdotes': {
    title: 'Muziek Anekdotes - Bijzondere Verhalen uit de Muziekwereld | MusicScan',
    description: 'Ontdek fascinerende anekdotes en bijzondere verhalen uit de muziekwereld. Van legendarische concerten tot onbekende weetjes.',
    keywords: 'muziek anekdotes, muziek verhalen, muziek weetjes, muziek trivia'
  },
  '/artists': {
    title: 'Artiesten - Biografieën & Verhalen | MusicScan',
    description: 'Ontdek de biografieën en verhalen van je favoriete artiesten. Van doorbraak tot nalatenschap.',
    keywords: 'artiesten biografieën, artiest verhalen, muzikanten, bandgeschiedenis'
  },
  '/singles': {
    title: 'Singles - Verhalen achter de Hits | MusicScan',
    description: 'Ontdek de verhalen achter iconische singles en hits. Van studiosessies tot cultuurimpact.',
    keywords: 'singles verhalen, hits geschiedenis, muziek singles, iconische nummers'
  },
  '/scanner': {
    title: 'Smart Scanner - Vinyl & CD Herkenning | MusicScan',
    description: 'Scan je vinyl platen en CD\'s met slimme herkenning. Krijg direct informatie, prijzen en details over je muziek.',
    keywords: 'vinyl scanner, CD scanner, muziek herkenning, album identificatie'
  },
  '/scan': {
    title: 'Scan Resultaten - Muziek Herkenning & Waardebepaling | MusicScan',
    description: 'Bekijk je scan resultaten met slimme herkenning, actuele marktprijzen en gedetailleerde albuminformatie.',
    keywords: 'scan resultaten, muziek identificatie, vinyl waarde, CD prijzen'
  },
  '/my-collection': {
    title: 'Mijn Collectie - Digitale Vinyl & CD Bibliotheek | MusicScan',
    description: 'Beheer je persoonlijke muziekcollectie. Bekijk je vinyl platen, CD\'s en hun actuele marktwaarde.',
    keywords: 'muziek collectie, vinyl bibliotheek, CD collectie, collectie beheer'
  },
  '/shop': {
    title: 'Shop - Unieke Muziek Merchandise & Art | MusicScan',
    description: 'Ontdek unieke muziek merchandise, art prints, t-shirts, sokken en meer. De beste shop voor muziekliefhebbers.',
    keywords: 'muziek merchandise, muziek art, band shirts, muziek posters, muziek shop'
  },
  '/public-catalog': {
    title: 'Publieke Catalogus - Ontdek Muziek Collecties | MusicScan',
    description: 'Verken publieke muziekcollecties van de MusicScan community. Ontdek zeldzame vinyl, populaire CD\'s en trends.',
    keywords: 'publieke catalogus, muziek collecties, vinyl database, CD database'
  }
};