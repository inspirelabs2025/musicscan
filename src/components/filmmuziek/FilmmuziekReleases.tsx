import React from 'react';
import { Disc3, ExternalLink, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFilmmuziekReleases } from '@/hooks/useFilmmuziek';

export const FilmmuziekReleases = () => {
  const { data: releases, isLoading } = useFilmmuziekReleases(8);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-900/50 to-amber-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Nieuwe Soundtrack Releases</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-900/50 to-amber-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
              <Disc3 className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm">Nieuwe Releases</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Nieuwe Soundtrack Releases</h2>
            <p className="text-white/60 mt-2">Binnenkort nieuwe soundtrack releases</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900/50 to-amber-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Disc3 className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Nieuwe Releases</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Nieuwe Soundtrack Releases</h2>
          <p className="text-white/60 mt-2">De nieuwste soundtrack releases op Spotify</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {releases.map((release) => (
            <a
              key={release.id}
              href={release.spotify_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="overflow-hidden border-transparent hover:border-amber-500/30 transition-all bg-white/5 backdrop-blur">
                <div className="aspect-square relative overflow-hidden">
                  {release.artwork_url ? (
                    <img
                      src={release.artwork_url}
                      alt={release.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-900/50 to-slate-900/80 flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-amber-400/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {release.title}
                  </h3>
                  <p className="text-white/60 text-xs mt-1 line-clamp-1">{release.artist}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://open.spotify.com/search/soundtrack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            Meer op Spotify
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
