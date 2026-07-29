import { Link } from 'react-router-dom';
import { Smartphone, Globe, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  APP_STORE_AVAILABLE,
  APP_STORE_URL,
  PLAY_STORE_URL,
  type Locale,
} from '@/config/site';
import { APP_COPY } from '@/i18n/coreSeo';

interface AppLinksProps {
  locale: Locale;
  compact?: boolean;
}

/** Google Play (live), App Store (soon) and the web version — one place. */
export function AppLinks({ locale, compact = false }: AppLinksProps) {
  const copy = APP_COPY[locale];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {!compact && (
        <>
          <h2 className="text-2xl font-bold mb-2">{copy.heading}</h2>
          <p className="text-muted-foreground mb-6">{copy.intro}</p>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Smartphone className="w-4 h-4 mr-2" aria-hidden="true" />
            {copy.play}
          </a>
        </Button>

        {APP_STORE_AVAILABLE ? (
          <Button asChild size="lg" variant="outline">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Apple className="w-4 h-4 mr-2" aria-hidden="true" />
              iOS
            </a>
          </Button>
        ) : (
          <Button size="lg" variant="outline" disabled>
            <Apple className="w-4 h-4 mr-2" aria-hidden="true" />
            {copy.ios}
          </Button>
        )}

        <Button asChild size="lg" variant="secondary">
          <Link to="/scan">
            <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
            {copy.web}
          </Link>
        </Button>
      </div>
      {!compact && <p className="text-sm text-muted-foreground mt-4">{copy.webBody}</p>}
    </div>
  );
}
