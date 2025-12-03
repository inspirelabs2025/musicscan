import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useDanceHouseVerhalen } from '@/hooks/useDanceHouseMuziek';
import { Skeleton } from '@/components/ui/skeleton';

export const DanceHouseVerhalen = () => {
  const { data: verhalen, isLoading } = useDanceHouseVerhalen(6);

  return (
    <section className="py-16 bg-gradient-to-br from-purple-950/30 to-pink-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/20 rounded-full mb-4">
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-sm">Album Verhalen</span>
          </div>
          <h2 className="text-3xl font-bold">Dance & House Verhalen</h2>
          <p className="text-muted-foreground mt-2">Verhalen achter iconische dance albums</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))
            : verhalen?.map((verhaal) => (
                <Link
                  key={verhaal.id}
                  to={`/muziek-verhaal/${verhaal.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full bg-background/50 backdrop-blur border-transparent hover:border-pink-500/50 transition-all">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={verhaal.artwork_url || '/placeholder.svg'}
                        alt={verhaal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {verhaal.genre && (
                        <span className="absolute bottom-3 left-3 px-2 py-1 bg-pink-500/80 text-white text-xs rounded">
                          {verhaal.genre}
                        </span>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg group-hover:text-pink-400 transition-colors line-clamp-2">
                        {verhaal.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{verhaal.artist_name}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {verhaal.excerpt || verhaal.story_content?.substring(0, 100) + '...'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {(!verhalen || verhalen.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nog geen dance verhalen beschikbaar.</p>
            <Link
              to="/muziek-verhaal"
              className="text-pink-400 hover:text-pink-300 text-sm font-medium mt-2 inline-block"
            >
              Bekijk alle muziekverhalen →
            </Link>
          </div>
        )}

        {verhalen && verhalen.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/muziek-verhaal?genre=electronic"
              className="text-pink-400 hover:text-pink-300 text-sm font-medium inline-flex items-center gap-2"
            >
              Bekijk alle dance verhalen
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
