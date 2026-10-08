import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { ValuePageLinks } from '@/components/ValuePageLinks';
import { Camera } from 'lucide-react';

import { WAARDE_HUB_COPY as COPY, type Media } from '@/content/waardeHubCopy';

const WaardeHub: React.FC = () => {
  const { pathname } = useLocation();
  const media: Media = pathname.endsWith('/cd') ? 'cd' : 'lp';
  const copy = COPY[media];

  useSEO({ title: copy.title, description: copy.description });

  const { data: stats } = useQuery({
    queryKey: ['value-hub-stats'],
    queryFn: async () => {
      const { count } = await supabase
        .from('value_pages' as any)
        .select('group_slug', { count: 'exact', head: true })
        .not('price_range_min', 'is', null);
      return { pages: count ?? 0 };
    },
  });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-balance">{copy.h1}</h1>
        {copy.intro.map((p) => (
          <p key={p.slice(0, 40)} className="mt-4 text-[15px] leading-relaxed">{p}</p>
        ))}

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Scan je exemplaar
        </Link>

        {copy.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-primary mb-2">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p.slice(0, 40)} className="mt-2 text-[15px] leading-relaxed">{p}</p>
            ))}
          </section>
        ))}

        <ValuePageLinks limit={1000} hub={media} byLetter heading={copy.linksHeading} />
        {stats?.pages ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {stats.pages} albums uitgezocht, en er komen er wekelijks bij.
          </p>
        ) : null}

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-5">Veelgestelde vragen</h2>
          <dl className="space-y-4">
            {copy.faq.map((f) => (
              <div key={f.q} className="rounded-lg border bg-card p-5">
                <dt className="font-semibold mb-1">{f.q}</dt>
                <dd className="text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Ook handig:{' '}
          <Link to={media === 'lp' ? '/waarde/cd' : '/waarde/lp'} className="text-primary underline">
            {media === 'lp' ? 'wat is je cd waard' : 'wat is je lp waard'}
          </Link>{' '}
          en{' '}
          <Link to="/waarde-van-je-platen" className="text-primary underline">
            de waarde van je platencollectie
          </Link>
          .
        </p>
      </main>
    </div>
  );
};

export default WaardeHub;
