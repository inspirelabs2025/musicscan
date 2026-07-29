import { Link, useLocation } from 'react-router-dom';
import { Camera, ScanLine, Sparkles } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { Button } from '@/components/ui/button';
import { AppLinks } from '@/components/core/AppLinks';
import { SITE_URL, corePath, localeFromPath, matchCorePath } from '@/config/site';
import { SCAN_COPY, CORE_SEO } from '@/i18n/coreSeo';

export default function ScanLanding() {
  const { pathname } = useLocation();
  const locale = matchCorePath(pathname)?.locale ?? localeFromPath(pathname);
  const copy = SCAN_COPY[locale];
  const seo = CORE_SEO.scan[locale];
  useSEO({ noindex: false });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: seo.title,
    description: seo.description,
    url: `${SITE_URL}${corePath('scan', locale)}`,
    step: copy.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.body,
    })),
  };

  const icons = [Camera, ScanLine, Sparkles];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema} />
      <JsonLd data={howToSchema} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {copy.heading}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{copy.intro}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button asChild size="lg">
              <Link to="/scan">{copy.ctaPrimary}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={corePath('value', locale)}>{copy.ctaSecondary}</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3 mb-16">
          {copy.steps.map((step, i) => {
            const Icon = icons[i] ?? Camera;
            return (
              <article key={step.title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
                <h2 className="font-semibold text-lg mb-2">{step.title}</h2>
                <p className="text-muted-foreground text-sm">{step.body}</p>
              </article>
            );
          })}
        </section>

        <section className="mb-16">
          <AppLinks locale={locale} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">{copy.faqTitle}</h2>
          <dl className="space-y-4">
            {copy.faq.map((item) => (
              <div key={item.q} className="rounded-lg border border-border bg-card p-5">
                <dt className="font-semibold mb-1">{item.q}</dt>
                <dd className="text-muted-foreground text-sm">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
