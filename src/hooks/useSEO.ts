import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  title: 'MusicScan - AI-Powered Vinyl & CD Scanner | Scan, Identify & Value Your Music Collection',
  description: 'Scan your vinyl records and CDs with AI recognition. Get instant price valuations, discover album details, and build your digital music collection. Free music scanner app for collectors.',
  keywords: 'vinyl scanner, CD scanner, music collection app, record identification, album scanner, music collector tool, vinyl recognition, CD identification, music valuation',
  image: '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
  type: 'website',
  siteName: 'MusicScan',
  locale: 'nl_NL',
};

export const useSEO = (seoData?: Partial<SEOData>) => {
  const location = useLocation();
  
  useEffect(() => {
    const finalSEO = { ...DEFAULT_SEO, ...seoData };
    const currentUrl = `https://www.musicscan.app${location.pathname}`;
    
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
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalSEO.canonicalUrl || currentUrl);
    
    // Language alternate
    let hreflangNL = document.querySelector('link[hreflang="nl"]');
    if (!hreflangNL) {
      hreflangNL = document.createElement('link');
      hreflangNL.setAttribute('rel', 'alternate');
      hreflangNL.setAttribute('hreflang', 'nl');
      document.head.appendChild(hreflangNL);
    }
    hreflangNL.setAttribute('href', currentUrl);
    
    let hreflangEN = document.querySelector('link[hreflang="en"]');
    if (!hreflangEN) {
      hreflangEN = document.createElement('link');
      hreflangEN.setAttribute('rel', 'alternate');
      hreflangEN.setAttribute('hreflang', 'en');
      document.head.appendChild(hreflangEN);
    }
    hreflangEN.setAttribute('href', currentUrl.replace('musicscan.app', 'musicscan.app/en'));
    
  }, [seoData, location.pathname]);
};

// Route-specific SEO configurations
export const SEO_CONFIGS = {
  '/': {
    title: 'MusicScan - AI-Powered Vinyl & CD Scanner | Scan, Identify & Value Your Music Collection',
    description: 'Scan your vinyl records and CDs with AI recognition. Get instant price valuations, discover album details, and build your digital music collection. Free music scanner app for collectors.',
    keywords: 'vinyl scanner, CD scanner, music collection app, record identification, album scanner, music collector tool'
  },
  '/scanner': {
    title: 'Music Scanner - Upload & Identify Your Vinyl & CDs | MusicScan',
    description: 'Upload photos of your vinyl records and CDs for instant AI identification. Get detailed album information, pricing, and technical specifications.',
    keywords: 'music scanner, vinyl upload, CD identification, album recognition, music photo scanner'
  },
  '/scan': {
    title: 'Scan Results - AI Music Recognition & Valuation | MusicScan',
    description: 'View your music scan results with AI-powered identification, current market prices, and detailed album information.',
    keywords: 'scan results, music identification, vinyl valuation, CD prices, album details'
  },
  '/my-collection': {
    title: 'My Music Collection - Digital Vinyl & CD Library | MusicScan',
    description: 'Browse and manage your personal digital music collection. Track vinyl records, CDs, and their current market values.',
    keywords: 'music collection, vinyl library, CD collection, digital music catalog, collection management'
  },
  '/ai-analysis': {
    title: 'AI Music Analysis - Discover Your Collection Insights | MusicScan',
    description: 'Get AI-powered insights about your music collection. Discover genres, rarities, value trends, and personalized recommendations.',
    keywords: 'AI music analysis, collection insights, music recommendations, genre analysis, collection statistics'
  },
  '/collection-chat': {
    title: 'Collection Chat - AI Assistant for Your Music Library | MusicScan',
    description: 'Chat with AI about your music collection. Ask questions, get recommendations, and explore your vinyl and CD library in a conversational way.',
    keywords: 'music collection chat, AI music assistant, collection questions, music recommendations'
  },
  '/public-catalog': {
    title: 'Public Music Catalog - Browse Community Collections | MusicScan',
    description: 'Explore public music collections from the MusicScan community. Discover rare vinyl, popular CDs, and music trends.',
    keywords: 'public music catalog, community collections, vinyl database, CD database, music discovery'
  }
};