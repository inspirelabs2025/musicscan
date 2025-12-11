import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, Music, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { getAllAnecdotes } from '@/components/christmas/ChristmasAnecdote';

const ChristmasAnecdotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const anecdotes = getAllAnecdotes();

  const filteredAnecdotes = anecdotes.filter(anecdote => 
    anecdote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    anecdote.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    anecdote.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    anecdote.song.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Kerst Muziek Anekdotes | MusicScan</title>
        <meta name="description" content="Ontdek fascinerende verhalen achter je favoriete kerstnummers. Van Mariah Carey's miljardenhit tot de oorlogshit van Bing Crosby." />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-gradient-to-b from-background via-red-950/5 to-background pt-20">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <Button asChild variant="ghost" className="mb-6">
              <Link to="/kerst" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Terug naar Kerst
              </Link>
            </Button>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-10 w-10 text-yellow-500" />
              Kerst Muziek Anekdotes
              <Sparkles className="h-10 w-10 text-yellow-500" />
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fascinerende verhalen en weetjes achter de meest iconische kerstnummers aller tijden
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Zoek op artiest, nummer of verhaal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-center mb-8">
            <span className="text-muted-foreground">
              {filteredAnecdotes.length} anekdotes gevonden
            </span>
          </div>

          {/* Anecdotes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnecdotes.map((anecdote, index) => (
              <Card 
                key={anecdote.id} 
                className="bg-gradient-to-br from-card to-red-950/10 border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {anecdote.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        {anecdote.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Music className="h-3 w-3" />
                        <span className="font-medium">{anecdote.artist}</span>
                        <span>•</span>
                        <span>"{anecdote.song}"</span>
                        {anecdote.year && (
                          <>
                            <span>•</span>
                            <span>{anecdote.year}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAnecdotes.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🎅</span>
              <p className="text-muted-foreground">Geen anekdotes gevonden voor "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ChristmasAnecdotesPage;
