import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Disc, Star, Calendar, Shuffle, ExternalLink, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlbumBlogPost } from '@/hooks/useAlbumBlogPost';

interface Album {
  id: string;
  artist: string;
  title: string;
  year?: number;
  genre?: string;
  discogs_id?: number;
  created_at: string;
  condition_grade?: string;
  estimated_value?: number;
}

interface AlbumOfTheDayProps {
  albums: Album[];
}

export const AlbumOfTheDay = ({ albums }: AlbumOfTheDayProps) => {
  const [dailyAlbum, setDailyAlbum] = useState<Album | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  
  const { data: blogPost, isLoading: blogLoading } = useAlbumBlogPost(dailyAlbum?.id || null);

  // Generate deterministic "random" album based on today's date
  useEffect(() => {
    if (!albums || albums.length === 0) return;

    const today = new Date().toDateString();
    const hash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const albumIndex = Math.abs(hash) % albums.length;
    const selectedAlbum = albums[albumIndex];
    setDailyAlbum(selectedAlbum);

    // Generate fun facts about the album
    generateFunFacts(selectedAlbum);
  }, [albums]);

  const generateFunFacts = (album: Album) => {
    const facts: string[] = [];
    
    if (album.year) {
      const age = new Date().getFullYear() - album.year;
      facts.push(`🕰️ Dit album is ${age} jaar oud`);
      
      if (age >= 50) {
        facts.push(`🏆 Een echte vintage klassieker!`);
      } else if (age >= 30) {
        facts.push(`📻 Uit de gouden tijd van de muziek`);
      } else if (age >= 10) {
        facts.push(`💿 Een moderne klassieker`);
      }
    }

    if (album.genre) {
      facts.push(`🎵 Genre: ${album.genre}`);
    }

    if (album.condition_grade) {
      facts.push(`💎 Conditie: ${album.condition_grade}`);
    }

    if (album.estimated_value) {
      if (album.estimated_value > 100) {
        facts.push(`💰 Waardevolle vondst! (€${album.estimated_value})`);
      } else if (album.estimated_value > 50) {
        facts.push(`💵 Degelijke waarde (€${album.estimated_value})`);
      }
    }

    // Add some general fun facts
    const dayOfWeek = new Date().getDay();
    const weekdayFacts = [
      "🌟 Perfect om je week mee te beginnen!",
      "🎯 Ideaal voor een dinsdagse muziekervaring",
      "⚡ Midden in de week, midden in je hart",
      "🌈 Donderdag vibes met dit album",
      "🎉 Vrijdag feeling komt eraan!",
      "🛋️ Weekend luistergenot",
      "😌 Zondag ontspanning gegarandeerd"
    ];
    facts.push(weekdayFacts[dayOfWeek]);

    setFunFacts(facts.slice(0, 3)); // Keep max 3 facts
  };

  const shuffleAlbum = () => {
    if (!albums || albums.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * albums.length);
    const newAlbum = albums[randomIndex];
    setDailyAlbum(newAlbum);
    generateFunFacts(newAlbum);
  };

  if (!dailyAlbum) {
    return (
      <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vinyl-gold" />
            🌟 Album van de Dag
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Disc className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Voeg albums toe aan je collectie om je dagelijkse aanbeveling te zien!
          </p>
          <Button asChild className="mt-3">
            <Link to="/scanner">
              <Star className="w-4 h-4 mr-2" />
              Start Scannen
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300 bg-gradient-to-br from-background via-vinyl-gold/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vinyl-gold" />
            🌟 Album van de Dag
          </div>
          <Button
            onClick={shuffleAlbum}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Shuffle className="w-3 h-3" />
            Shuffle
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Album Info */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20 rounded-full flex items-center justify-center mx-auto">
            <Disc className="w-10 h-10 text-vinyl-purple animate-spin-slow" />
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {dailyAlbum.title}
            </h3>
            <p className="text-vinyl-purple font-medium">
              {dailyAlbum.artist}
            </p>
            {dailyAlbum.year && (
              <Badge variant="secondary" className="mt-1">
                {dailyAlbum.year}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-2">
          <Tabs defaultValue={blogPost ? "verhaal" : "facts"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="verhaal" disabled={!blogPost} className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Verhaal
              </TabsTrigger>
              <TabsTrigger value="facts" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Fun Facts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="verhaal" className="space-y-2 mt-0">
              {blogLoading ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Verhaal laden...
                </div>
              ) : blogPost ? (
                <div className="space-y-2">
                  <div className="text-xs bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 rounded-lg px-3 py-2">
                    <p className="line-clamp-3">
                      {blogPost.markdown_content.replace(/[#*_`]/g, '').substring(0, 200)}...
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={`/plaat-verhaal/${blogPost.slug}`}>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Lees volledig verhaal
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Geen verhaal beschikbaar voor dit album
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="facts" className="space-y-1 mt-0">
              {funFacts.map((fact, index) => (
                <p key={index} className="text-xs bg-accent/10 rounded-lg px-3 py-2">
                  {fact}
                </p>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Link to={`/my-collection`}>
              <Star className="w-3 h-3" />
              Bekijk in Collectie
            </Link>
          </Button>
          
          {dailyAlbum.discogs_id && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <a 
                href={`https://www.discogs.com/release/${dailyAlbum.discogs_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
                Discogs
              </a>
            </Button>
          )}
        </div>

        {/* Inspirational Quote */}
        <div className="text-center pt-2 border-t border-accent/20">
          <p className="text-xs text-muted-foreground italic">
            "Elke dag een nieuwe muzikale ontdekking in je eigen collectie"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};