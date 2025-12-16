import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useFilmmuziekVerhalen } from '@/hooks/useFilmmuziek';

export const FilmmuziekVerhalen = () => {
  const { data: verhalen, isLoading } = useFilmmuziekVerhalen(6);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Soundtrack Verhalen</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!verhalen || verhalen.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm">Verhalen</span>
            </div>
            <h2 className="text-3xl font-bold">Soundtrack Verhalen</h2>
            <p className="text-muted-foreground mt-2">Binnenkort meer verhalen over iconische soundtracks</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Verhalen</span>
          </div>
          <h2 className="text-3xl font-bold">Soundtrack Verhalen</h2>
          <p className="text-muted-foreground mt-2">Ontdek de verhalen achter iconische filmscores</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verhalen.map((verhaal) => (
            <Link
              key={verhaal.id}
              to={`/muziek-verhaal/${verhaal.slug}`}
              className="group"
            >
              <Card className="overflow-hidden border-transparent hover:border-amber-500/30 transition-all h-full">
                <div className="aspect-video relative overflow-hidden">
                  {verhaal.artwork_url ? (
                    <img
                      src={verhaal.artwork_url}
                      alt={verhaal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-900/50 to-slate-900/80 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-amber-400/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg group-hover:text-amber-400 transition-colors line-clamp-2">
                    {verhaal.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{verhaal.artist_name}</p>
                  {verhaal.genre && (
                    <span className="inline-block mt-2 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded">
                      {verhaal.genre}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/verhalen?genre=soundtrack"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            Bekijk alle soundtrack verhalen
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
