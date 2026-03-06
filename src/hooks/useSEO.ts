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
  title: 'MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop & Quiz',
  description: 'Ontdek MusicScan: lees de verhalen achter iconische albums, scan je vinyl & CD collectie, shop unieke muziekart en test je kennis met de muziekquiz. Alles voor echte muziekliefhebbers.',
  keywords: 'muziekplatform, muzieknieuws, album verhalen, artiesten verhalen, muziek shop, vinyl scanner, CD scanner, muziek quiz, muziek collectie, waardebepaling, lp waarde app',
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
    title: 'MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop & Quiz',
    description: 'Ontdek MusicScan: lees de verhalen achter iconische albums, scan je vinyl & CD collectie, shop unieke muziekart en test je kennis met de muziekquiz. Alles voor echte muziekliefhebbers.',
    keywords: 'muziekplatform, muzieknieuws, album verhalen, artiesten, muziek shop, vinyl scanner, muziek quiz, waardebepaling'
  },
  '/verhalen': {
    title: 'Muziekverhalen - De Geschiedenis achter Iconische Albums | MusicScan',
    description: 'Lees de onvertelde verhalen achter legendarische albums en artiesten. Van studiosessies tot doorbraken — ontdek wat je nog niet wist.',
    keywords: 'muziekverhalen, album verhalen, artiest verhalen, singles verhalen, muziek geschiedenis'
  },
  '/nieuws': {
    title: 'Muzieknieuws - Nieuwe Releases & Actueel | MusicScan',
    description: 'Het laatste muzieknieuws: nieuwe releases, concerten en albumreviews. Blijf als eerste op de hoogte van alles in de muziekwereld.',
    keywords: 'muzieknieuws, nieuwe releases, concert nieuws, album reviews, muziek actualiteit'
  },
  '/verhalen': {
    title: 'Muziekverhalen - De Geschiedenis achter Albums & Artiesten | MusicScan',
    description: 'Lees de onvertelde verhalen achter legendarische albums en artiesten. Van studiosessies tot doorbraken — ontdek wat je nog niet wist.',
    keywords: 'muziekverhalen, album verhalen, artiest verhalen, singles verhalen, muziek geschiedenis'
  },
  '/quiz': {
    title: 'Muziek Quiz - Hoe Goed Ken Jij Muziek? | MusicScan',
    description: 'Test je muziekkennis met onze interactieve quiz! Van klassiekers tot moderne hits — daag jezelf uit en vergelijk je score met anderen.',
    keywords: 'muziek quiz, muziekkennis test, album quiz, artiesten quiz'
  },
  '/vandaag-in-de-muziekgeschiedenis': {
    title: 'Vandaag in de Muziekgeschiedenis - Wat Gebeurde Er? | MusicScan',
    description: 'Welke legendarische albums verschenen vandaag? Welke artiesten werden geboren? Ontdek dagelijks bijzondere muzikale mijlpalen.',
    keywords: 'vandaag in de muziekgeschiedenis, muziek kalender, historische muziek gebeurtenissen'
  },
  '/anekdotes': {
    title: 'Muziek Anekdotes - Ongelooflijke Verhalen uit de Muziekwereld | MusicScan',
    description: 'De gekste, grappigste en meest bijzondere anekdotes uit de muziekwereld. Van backstage verhalen tot studio-incidenten.',
    keywords: 'muziek anekdotes, muziek verhalen, muziek weetjes, muziek trivia'
  },
  '/artists': {
    title: 'Artiesten - Biografieën & Carrièreverhalen | MusicScan',
    description: 'Ontdek de complete verhalen van je favoriete artiesten. Van eerste demo tot wereldwijde doorbraak — lees hun muzikale reis.',
    keywords: 'artiesten biografieën, artiest verhalen, muzikanten, bandgeschiedenis'
  },
  '/singles': {
    title: 'Singles - Het Verhaal achter de Grootste Hits | MusicScan',
    description: 'Ontdek hoe iconische hits zijn ontstaan. Van eerste idee tot nummer 1 — de verhalen achter de muziek die je kent.',
    keywords: 'singles verhalen, hits geschiedenis, muziek singles, iconische nummers'
  },
  '/scanner': {
    title: 'Vinyl & CD Scanner - Herken en Waardeer je Muziek | MusicScan',
    description: 'Scan je vinyl platen en CD\'s: directe herkenning, actuele marktprijzen en gedetailleerde albuminformatie. Ontdek wat jouw collectie waard is.',
    keywords: 'vinyl scanner, CD scanner, muziek herkenning, album identificatie, lp waarde app, vinyl waarde bepalen'
  },
  '/scan': {
    title: 'Scan Resultaten - Waarde & Details van je Muziek | MusicScan',
    description: 'Bekijk je scanresultaten met actuele marktprijzen, conditiebeoordeling en gedetailleerde albuminformatie. Weet precies wat je hebt.',
    keywords: 'scan resultaten, muziek identificatie, vinyl waarde, CD prijzen'
  },
  '/my-collection': {
    title: 'Mijn Collectie - Beheer je Vinyl & CD Bibliotheek | MusicScan',
    description: 'Je complete muziekcollectie op één plek. Bekijk actuele waarde, sorteer op artiest of genre en houd je verzameling bij.',
    keywords: 'muziek collectie, vinyl bibliotheek, CD collectie, collectie beheer, lp collectie waarde'
  },
  '/shop': {
    title: 'Muziek Shop - Unieke Art Prints, Shirts & Merchandise | MusicScan',
    description: 'Ontdek unieke muziekproducten in de MusicScan Shop. Van vinyl art prints tot T-shirts en merchandise - vind het perfecte cadeau voor muziekliefhebbers.',
    keywords: 'muziek merchandise, muziek art, band shirts, muziek posters, muziek shop'
  },
  '/public-catalog': {
    title: 'Muziek Catalogus - Ontdek Vinyl & CD Collecties | MusicScan',
    description: 'Verken duizenden vinyl platen en CD\'s uit de MusicScan community. Ontdek zeldzame releases en populaire albums.',
    keywords: 'publieke catalogus, muziek collecties, vinyl database, CD database'
  }
};