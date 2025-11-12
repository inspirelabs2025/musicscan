import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAnecdotes } from '@/hooks/useAnecdotes';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, TrendingUp, Calendar, Eye } from 'lucide-react';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const SUBJECT_TYPES = [
  { value: 'all', label: 'Alle Types' },
  { value: 'artist', label: 'Artiesten' },
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'studio', label: 'Studio\'s' },
  { value: 'musician', label: 'Musici' },
  { value: 'producer', label: 'Producers' },
  { value: 'label', label: 'Labels' },
  { value: 'venue', label: 'Venues' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Nieuwste eerst' },
  { value: 'popular', label: 'Meest populair' },
  { value: 'oldest', label: 'Oudste eerst' },
];

export default function AnecdotesOverview() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectType, setSubjectType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  const { data: anecdotes, isLoading } = useAnecdotes({
    searchQuery,
    subjectType,
    sortBy,
  });

  return (
    <>
      <Helmet>
        <title>Muziek Anekdotes - Dagelijkse Verhalen | MusicScan</title>
        <meta name="description" content="Ontdek boeiende anekdotes uit de muziekgeschiedenis. Elke dag een nieuw verhaal over artiesten, albums, songs en meer." />
        <meta name="keywords" content="muziek anekdotes, muziekgeschiedenis, dagelijkse verhalen, artiesten, albums" />
        <link rel="canonical" href="https://www.musicscan.app/anekdotes" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.musicscan.app/anekdotes" />
        <meta property="og:title" content="Muziek Anekdotes - Dagelijkse Verhalen | MusicScan" />
        <meta property="og:description" content="Ontdek boeiende anekdotes uit de muziekgeschiedenis. Elke dag een nieuw verhaal." />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Muziek Anekdotes - Dagelijkse Verhalen | MusicScan" />
        <meta name="twitter:description" content="Ontdek boeiende anekdotes uit de muziekgeschiedenis." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <BreadcrumbNavigation
          items={[
            { name: 'Home', url: '/' },
            { name: 'Anekdotes', url: '/anekdotes' },
          ]}
        />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-vinyl-gold via-primary to-vinyl-gold/50 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              📖 Muziek Anekdotes
            </h1>
            <p className="text-xl text-center max-w-2xl mx-auto">
              Dagelijkse verhalen uit de muziekgeschiedenis
            </p>

            {anecdotes && (
              <div className="flex justify-center gap-8 mt-8 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold">{anecdotes.length}</div>
                  <div className="text-sm opacity-90">Anekdotes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {Math.round(anecdotes.reduce((sum, a) => sum + (a.views_count || 0), 0) / anecdotes.length)}
                  </div>
                  <div className="text-sm opacity-90">Gem. Views</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek anekdotes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={subjectType} onValueChange={setSubjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter op type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sorteer op" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Anecdotes Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Anekdotes laden...</p>
            </div>
          ) : anecdotes && anecdotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {anecdotes.map((anecdote) => (
                <Card
                  key={anecdote.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/anekdotes/${anecdote.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="mb-2">
                        {SUBJECT_TYPES.find((t) => t.value === anecdote.subject_type)?.label || anecdote.subject_type}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(anecdote.anecdote_date), 'd MMM yyyy', { locale: nl })}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {anecdote.anecdote_title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {anecdote.subject_type}: {anecdote.subject_name}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {anecdote.anecdote_content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {anecdote.views_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {anecdote.reading_time || 1} min
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                        Lees meer →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  Geen anekdotes gevonden met deze filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
