import { useLocation } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { AppLinks } from '@/components/core/AppLinks';
import {
  PLAY_STORE_URL,
  SITE_URL,
  SITE_NAME,
  corePath,
  localeFromPath,
  matchCorePath,
} from '@/config/site';
import { APP_COPY, CORE_SEO } from '@/i18n/coreSeo';

export default function AppDownload() {
  const { pathname } = useLocation();
  const locale = matchCorePath(pathname)?.locale ?? localeFromPath(pathname);
  const copy = APP_COPY[locale];
  const seo = CORE_SEO.app[locale];
  useSEO({ noindex: false });

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Android, Web',
    description: seo.description,
    url: `${SITE_URL}${corePath('app', locale)}`,
    downloadUrl: PLAY_STORE_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={appSchema} />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {copy.heading}
        </h1>
        <p className="text-lg text-muted-foreground mb-10">{copy.intro}</p>
        <AppLinks locale={locale} />
      </main>
    </div>
  );
}
