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
  title: 'Vinyl Scanner & Muziekplatform | Scan je LP Collectie | MusicScan',
  description: 'Scan je vinyl en CD collectie, ontdek de waarde van je platen, lees verhalen achter iconische albums en test je muziekkennis. Gratis vinyl scanner met AI herkenning.',
  keywords: 'vinyl scanner, vinyl waarde bepalen, LP collectie scannen, muziekplatform, muzieknieuws, album verhalen, muziek quiz, vinyl waarde app',
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
    title: 'Vinyl Scanner & Muziekplatform | Scan je LP Collectie | MusicScan',
    description: 'Scan je vinyl en CD collectie, ontdek de waarde van je platen, lees verhalen achter iconische albums en test je muziekkennis. Gratis vinyl scanner met AI herkenning.',
    keywords: 'vinyl scanner, vinyl waarde bepalen, LP collectie scannen, muziekplatform'
  },
  '/verhalen': {
    title: 'Muziekverhalen — Het Verhaal Achter Iconische Albums & Singles | MusicScan',
    description: 'Ontdek de verhalen achter legendarische albums en singles. Van studio-geheimen tot de inspiratie achter de muziek. Lees diepgaande muziekverhalen over artiesten en platen.',
    keywords: 'album verhalen, verhaal achter het album, muziekgeschiedenis, muziekverhalen'
  },
  '/nieuws': {
    title: 'Muzieknieuws — Nieuwe Releases & Actueel | MusicScan',
    description: 'Het laatste muzieknieuws: nieuwe releases, concerten en albumreviews. Blijf als eerste op de hoogte van alles in de muziekwereld.',
    keywords: 'muzieknieuws, nieuwe releases, concert nieuws, album reviews, muziek actualiteit'
  },
  '/quizzen': {
    title: 'Muziekquiz — Test je Muziekkennis | Dagelijkse Challenge | MusicScan',
    description: 'Speel de dagelijkse muziekquiz en test je kennis over artiesten, albums en muziekgeschiedenis. Verdien punten, unlock badges en beklim het leaderboard.',
    keywords: 'muziekquiz, muziek quiz online, muziekkennis test'
  },
  '/vandaag-in-de-muziekgeschiedenis': {
    title: 'Vandaag in de Muziekgeschiedenis — Wat Gebeurde Er? | MusicScan',
    description: 'Welke legendarische albums verschenen vandaag? Welke artiesten werden geboren? Ontdek dagelijks bijzondere muzikale mijlpalen.',
    keywords: 'vandaag in de muziekgeschiedenis, muziek kalender, historische muziek gebeurtenissen'
  },
  '/anekdotes': {
    title: 'Muziek Anekdotes — Ongelooflijke Verhalen uit de Muziekwereld | MusicScan',
    description: 'De gekste, grappigste en meest bijzondere anekdotes uit de muziekwereld. Van backstage verhalen tot studio-incidenten.',
    keywords: 'muziek anekdotes, muziek verhalen, muziek weetjes, muziek trivia'
  },
  '/artists': {
    title: 'Artiesten — Ontdek Muzikanten & Hun Verhalen | MusicScan',
    description: 'Ontdek artiesten en hun muziekverhalen. Van legendarische rockbands tot jazz-iconen. Lees biografieën, bekijk discografieën en ontdek de muziek.',
    keywords: 'artiesten biografieën, artiest verhalen, muzikanten, bandgeschiedenis'
  },
  '/singles': {
    title: 'Singles — Het Verhaal achter de Grootste Hits | MusicScan',
    description: 'Ontdek hoe iconische hits zijn ontstaan. Van eerste idee tot nummer 1 — de verhalen achter de muziek die je kent.',
    keywords: 'singles verhalen, hits geschiedenis, muziek singles, iconische nummers'
  },
  '/ai-scan-v2': {
    title: 'Vinyl Scanner — Scan je LP & CD met AI Herkenning | MusicScan',
    description: 'Maak een foto van je vinyl, LP of CD en ontdek direct de artiest, het album en de marktwaarde. Gratis AI-scanner voor muziekcollecties. 10 gratis scans bij registratie.',
    keywords: 'vinyl scanner, LP scannen, CD scannen, plaat herkennen, vinyl waarde app'
  },
  '/scanner': {
    title: 'Vinyl Scanner — Scan je LP & CD met AI Herkenning | MusicScan',
    description: 'Maak een foto van je vinyl, LP of CD en ontdek direct de artiest, het album en de marktwaarde. Gratis AI-scanner voor muziekcollecties.',
    keywords: 'vinyl scanner, CD scanner, muziek herkenning, album identificatie, lp waarde app'
  },
  '/scan': {
    title: 'Scan Resultaten — Waarde & Details van je Muziek | MusicScan',
    description: 'Bekijk je scanresultaten met actuele marktprijzen, conditiebeoordeling en gedetailleerde albuminformatie. Weet precies wat je hebt.',
    keywords: 'scan resultaten, muziek identificatie, vinyl waarde, CD prijzen'
  },
  '/my-collection': {
    title: 'Mijn Collectie — Beheer je Vinyl & CD Bibliotheek | MusicScan',
    description: 'Je complete muziekcollectie op één plek. Bekijk actuele waarde, sorteer op artiest of genre en houd je verzameling bij.',
    keywords: 'muziek collectie, vinyl bibliotheek, CD collectie, collectie beheer, lp collectie waarde'
  },
  '/shop': {
    title: 'Muziek Shop — Posters, Metal Prints, Canvas & Merchandise | MusicScan',
    description: 'Shop unieke album art posters, metal prints, canvas doeken en muziek merchandise. Meer dan 6800 producten van je favoriete artiesten en albums.',
    keywords: 'album art poster, muziek poster, vinyl art, metal print album cover, muziek merchandise'
  },
  '/echo': {
    title: 'Magic Mike — AI Muziekexpert | Vraag Alles Over Muziek | MusicScan',
    description: 'Chat met Magic Mike, je persoonlijke AI muziekexpert. Stel vragen over albums, artiesten, muziekgeschiedenis en meer. Ken elk verhaal achter de plaat.',
    keywords: 'muziek AI, muziek chatbot, muziek vraag en antwoord'
  },
  '/fanwall': {
    title: 'Fanwall — Deel je Muziekcollectie & Favoriete Platen | MusicScan',
    description: 'Ontdek en deel muziek herinneringen: concertfoto\'s, vinyl collecties, en meer. Een visueel verhaal van muziekliefhebbers.',
    keywords: 'fanwall, muziek herinneringen, vinyl collectie delen'
  },
  '/podcasts': {
    title: 'De Plaat & Het Verhaal — Muziek Podcast | MusicScan',
    description: 'Luister naar de verhalen achter legendarische albums. Elke aflevering duikt diep in de muziekgeschiedenis.',
    keywords: 'muziek podcast, album verhalen podcast, muziekgeschiedenis'
  },
  '/public-catalog': {
    title: 'Muziek Catalogus — Ontdek Vinyl & CD Collecties | MusicScan',
    description: 'Verken duizenden vinyl platen en CD\'s uit de MusicScan community. Ontdek zeldzame releases en populaire albums.',
    keywords: 'publieke catalogus, muziek collecties, vinyl database, CD database'
  }
};