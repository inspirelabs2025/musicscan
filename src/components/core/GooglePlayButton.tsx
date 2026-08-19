import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAY_STORE_URL } from '@/config/site';

interface GooglePlayButtonProps {
  /** Where the click came from — appended as utm_content for tracking. */
  source?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

/** One reusable "Download in Google Play" call to action. */
export function GooglePlayButton({
  source,
  label = 'Download de Android app',
  className,
  variant = 'secondary',
  size = 'lg',
}: GooglePlayButtonProps) {
  const url = source ? `${PLAY_STORE_URL}&utm_content=${encodeURIComponent(source)}` : PLAY_STORE_URL;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Smartphone className="w-4 h-4 mr-2" aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}
