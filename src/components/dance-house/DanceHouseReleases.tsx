import React from 'react';
import { Disc, ExternalLink, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDanceHouseReleases } from '@/hooks/useDanceHouseMuziek';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export const DanceHouseReleases = () => {
  const { data: releases, isLoading } = useDanceHouseReleases(8);
  const { tr } = useLanguage();
  const ch = tr.countryHubUI;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full mb-4">
            <Disc className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">{ch.newReleases}</span>
          </div>
          <h2 className="text-3xl font-bold">{ch.latestDanceReleases}</h2>
          <p className="text-muted-foreground mt-2">{ch.freshFromStudio}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? [...Array(8)].map((_, i) => (<Card key={i} className="overflow-hidden"><Skeleton className="aspect-square" /><CardContent className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>))
            : releases?.map((release) => (
                <a key={release.id} href={release.spotify_url} target="_blank" rel="noopener noreferrer" className="group">
                  <Card className="overflow-hidden bg-background/50 hover:bg-background transition-colors border-transparent hover:border-green-500/50">
                    <div className="aspect-square relative overflow-hidden">
                      <img src={release.image_url || '/placeholder.svg'} alt={release.album_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"><Play className="w-6 h-6 text-white fill-white ml-1" /></div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-green-400 transition-colors">{release.album_name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{release.artist}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{new Date(release.release_date).toLocaleDateString('nl-NL')}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
        </div>

        {(!releases || releases.length === 0) && !isLoading && (
          <div className="text-center py-12"><p className="text-muted-foreground">{ch.noDanceReleases}</p></div>
        )}

        {releases && releases.length > 0 && (
          <div className="text-center mt-8">
            <a href="https://open.spotify.com/genre/electronic" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 text-sm font-medium inline-flex items-center gap-2">
              {ch.moreOnSpotify}<ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
