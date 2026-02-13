import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSingles } from '@/hooks/useSingles';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Search, Clock, Eye, Calendar, Sparkles } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { formatDate } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function Singles() {
  const { data: singles, isLoading } = useSingles();
  const [searchQuery, setSearchQuery] = useState('');

  useSEO({
    title: 'Singles | Verhalen over Iconische Muziek | MusicScan',
    description: 'Ontdek verhalen achter iconische singles uit de muziekgeschiedenis. Van klassiekers tot moderne hits.',
    keywords: 'singles, muziek verhalen, hit singles, muziekgeschiedenis',
    canonicalUrl: 'https://www.musicscan.app/singles'
  });

  const filteredSingles = useMemo(() => {
    if (!singles) return [];
    if (!searchQuery) return singles;

    const query = searchQuery.toLowerCase();
    return singles.filter(single => 
      single.artist?.toLowerCase().includes(query) ||
      single.single_name?.toLowerCase().includes(query) ||
      single.title?.toLowerCase().includes(query) ||
      single.genre?.toLowerCase().includes(query)
    );
  }, [singles, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-48 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-card/50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Musical Notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Music className="absolute top-20 left-[10%] w-6 h-6 text-blue-500/20 animate-float" style={{ animationDelay: '0s' }} />
        <Sparkles className="absolute top-40 right-[15%] w-4 h-4 text-purple-500/20 animate-float" style={{ animationDelay: '2s' }} />
        <Music className="absolute bottom-40 left-[20%] w-5 h-5 text-pink-500/30 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Music className="w-7 h-7 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">
              Singles Collectie
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Ontdek de verhalen achter iconische singles uit de muziekgeschiedenis
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Zoek op artiest, titel of genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm border-border/50"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              ✓ {filteredSingles.length} singles gevonden
            </p>
          )}
        </div>

        {/* Singles Grid */}
        {filteredSingles.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">
              {searchQuery ? 'Geen singles gevonden voor deze zoekopdracht' : 'Geen singles beschikbaar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSingles.map((single) => (
              <Link key={single.id} to={`/singles/${single.slug}`}>
                <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
                  <CardContent className="p-0">
                    {/* Artwork */}
                    {single.artwork_url && (
                      <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 rounded-t-xl overflow-hidden">
                        <img
                          src={single.artwork_url}
                          alt={`${single.artist} - ${single.single_name}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-6">
                      <Badge className="mb-3 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Music className="w-3 h-3 mr-1" />
                        SINGLE
                      </Badge>
                      
                      <h3 className="text-lg font-semibold mb-1 text-foreground group-hover:text-blue-400 transition-colors line-clamp-1">
                        {single.artist}
                      </h3>
                      <p className="text-base text-muted-foreground mb-4 line-clamp-2">
                        {single.single_name || single.title}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {single.year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {single.year}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {single.reading_time || Math.ceil(single.story_content.length / 1000)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {single.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
