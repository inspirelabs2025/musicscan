import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizeFullUrl } from '@/lib/utils';
import {
  OG_LOCALE,
  SITE_NAME,
  canonicalPathFor,
  hreflangAlternates,
  isIndexablePath,
  localeFromPath,
  matchCorePath,
} from '@/config/site';
import { CORE_SEO } from '@/i18n/coreSeo';

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
  noindex?: boolean;
}

const DEFAULT_SEO: SEOData = {
  title: 'Scan je platen en ontdek de waarde | MusicScan',
  description: 'Maak een foto van je LP, vinyl of CD en weet binnen 3-6 seconden wat je plaat is en wat hij waard is. Gratis proberen in de app of op het web.',
  keywords: 'platen scannen, vinyl waarde, lp waarde bepalen, cd scannen, platen taxeren',
  image: '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
  type: 'website',
  siteName: SITE_NAME,
  locale: 'nl_NL',
};

export const useSEO = (seoData?: Partial<SEOData>) => {
  const location = useLocation();
  
  useEffect(() => {
    const canonicalPath = canonicalPathFor(location.pathname);
    const core = matchCorePath(canonicalPath);
    const pageLocale = core?.locale ?? localeFromPath(canonicalPath);
    const coreSeo = core ? CORE_SEO[core.key][core.locale] : undefined;

    const finalSEO: SEOData = {
      ...DEFAULT_SEO,
      ...(coreSeo ? { ...coreSeo, locale: OG_LOCALE[pageLocale] } : {}),
      ...seoData,
    };
    // Allowlist is authoritative: a page can never index itself off-allowlist.
    const forceNoindex = !isIndexablePath(canonicalPath);
    finalSEO.noindex = forceNoindex || seoData?.noindex === true;
    const currentUrl = normalizeFullUrl(canonicalPath);
    
    
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
    const absoluteImage = normalizeFullUrl(finalSEO.image || DEFAULT_SEO.image!);
    updateMetaTag('og:title', finalSEO.title!, true);
    updateMetaTag('og:description', finalSEO.description!, true);
    updateMetaTag('og:image', absoluteImage, true);
    updateMetaTag('og:url', finalSEO.canonicalUrl || currentUrl, true);
    updateMetaTag('og:type', finalSEO.type || DEFAULT_SEO.type!, true);
    updateMetaTag('og:site_name', finalSEO.siteName || DEFAULT_SEO.siteName!, true);
    updateMetaTag('og:locale', finalSEO.locale || DEFAULT_SEO.locale!, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', finalSEO.title!);
    updateMetaTag('twitter:description', finalSEO.description!);
    updateMetaTag('twitter:image', absoluteImage);

    updateMetaTag('twitter:site', '@musicscan_app');
    updateMetaTag('twitter:creator', '@musicscan_app');
    
    // Additional SEO meta tags
    updateMetaTag('author', 'MusicScan');
    updateMetaTag('application-name', 'MusicScan');

    // Robots (noindex for thin/auto-generated pages)
    updateMetaTag('robots', finalSEO.noindex ? 'noindex, follow' : 'index, follow');
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalSEO.canonicalUrl || currentUrl);
    
    // hreflang alternates — only the core scan + value pages are localized.
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => el.remove());
    for (const alt of hreflangAlternates(location.pathname)) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', alt.href);
      document.head.appendChild(link);
    }

    // Document language follows the page locale.
    document.documentElement.setAttribute('lang', pageLocale);
    
    
  }, [
    location.pathname,
    seoData?.title,
    seoData?.description,
    seoData?.keywords,
    seoData?.image,
    seoData?.canonicalUrl,
    seoData?.type,
    seoData?.siteName,
    seoData?.locale,
    seoData?.noindex
  ]);
};

// Route-specific SEO configurations
export const SEO_CONFIGS = {
  '/': {
    title: 'Scan je platen en ontdek de waarde | MusicScan',
    description: 'Maak een foto van je LP, vinyl of CD en zie binnen 3-6 seconden welke plaat het is en wat hij waard is. Gratis proberen op web en in de app.',
    keywords: 'platen scannen, vinyl waarde bepalen, lp waarde, cd scannen, plaat taxeren'
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
    description: 'Maak een foto van je vinyl, LP of CD en ontdek direct de artiest, het album en de marktwaarde. Gratis AI-scanner voor muziekcollecties. Probeer gratis met 1 credit, meld je aan voor 3 credits.',
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