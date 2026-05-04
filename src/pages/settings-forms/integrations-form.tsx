import React from 'react';
import { SpotifyConnect } from '@/components/SpotifyConnect';
import { DiscogsConnectButton } from '@/components/collection/DiscogsConnectButton';
import { Separator } from '@/components/ui/separator';

export const IntegrationsForm: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Spotify</h3>
        <p className="text-xs text-muted-foreground">
          Verbind je Spotify-account om je luistergeschiedenis en nieuwe releases te zien.
        </p>
        <div className="pt-2">
          <SpotifyConnect />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Discogs</h3>
        <p className="text-xs text-muted-foreground">
          Verbind je Discogs-account om je collectie te synchroniseren en berichten te beheren.
        </p>
        <div className="pt-2">
          <DiscogsConnectButton />
        </div>
      </div>
    </div>
  );
};
