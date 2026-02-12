import { useVersionCheck } from '@/hooks/useVersionCheck';
import { RefreshCw } from 'lucide-react';

export const VersionBanner = () => {
  const { updateAvailable, refresh } = useVersionCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
      <span>Er is een nieuwe versie beschikbaar.</span>
      <button
        onClick={refresh}
        className="inline-flex items-center gap-1 underline font-medium hover:opacity-80"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Vernieuwen
      </button>
    </div>
  );
};
