import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMusicStoryGenerator } from '@/hooks/useMusicStoryGenerator';
import { Music, Search, BookOpen, Share2, X, Shuffle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/contexts/LanguageContext';

export const MusicStoryWidget = () => {
  const [query, setQuery] = useState('');
  const { tr } = useLanguage();
  const d = tr.dashboardUI;
  const { 
    generateStory, generateRandomStory, clearStory, isGenerating, currentStory,
    selectedGenre, setSelectedGenre, selectedPeriod, setSelectedPeriod
  } = useMusicStoryGenerator();

  const GENRES = [
    { value: 'alle', label: d.allGenres },
    { value: 'rock', label: 'Rock' }, { value: 'pop', label: 'Pop' },
    { value: 'jazz', label: 'Jazz' }, { value: 'electronic', label: 'Electronic' },
    { value: 'hip-hop', label: 'Hip-Hop' }, { value: 'folk', label: 'Folk' },
    { value: 'classical', label: 'Classical' }, { value: 'alternative', label: 'Alternative' },
    { value: 'punk', label: 'Punk' }, { value: 'reggae', label: 'Reggae' },
  ];

  const PERIODS = [
    { value: 'alle', label: d.allPeriods },
    { value: '1950s', label: d.decade50s }, { value: '1960s', label: d.decade60s },
    { value: '1970s', label: d.decade70s }, { value: '1980s', label: d.decade80s },
    { value: '1990s', label: d.decade90s }, { value: '2000s', label: d.decade2000s },
    { value: '2010s', label: d.decade2010s }, { value: '2020s', label: d.decade2020s },
  ];

  const handleSearch = () => { if (query.trim()) generateStory(query); };
  const handleRandomSearch = () => { generateRandomStory(); };

  const handleShare = () => {
    if (currentStory) {
      const shareText = `${d.storyShareTitle} "${currentStory.query}":\n\n${currentStory.story.substring(0, 200)}...`;
      if (navigator.share) {
        navigator.share({ title: `${d.storyShareTitle} ${currentStory.query}`, text: shareText });
      } else {
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  const popularSuggestions = [
    "Bohemian Rhapsody - Queen", "Hotel California - Eagles", 
    "Stairway to Heaven - Led Zeppelin", "Abbey Road - The Beatles",
    "The Dark Side of the Moon - Pink Floyd"
  ];

  return (
    <Card className="w-full h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{d.whatsTheStoryBehind}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentStory ? (
          <>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input placeholder={d.enterSongArtistAlbum} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="pr-10 w-full" />
                  <Music className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button onClick={handleSearch} disabled={isGenerating || !query.trim()} size="sm" className="w-full sm:w-auto">
                  {isGenerating ? (<><div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />{d.searching}</>) : (<><Search className="h-4 w-4 mr-2" />{d.search}</>)}
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{GENRES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={handleRandomSearch} disabled={isGenerating} size="sm" variant="outline" className="w-full sm:w-auto sm:ml-auto whitespace-nowrap">
                  {isGenerating ? (<><div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />{d.choosing}</>) : (<><Shuffle className="h-4 w-4 mr-2" />{d.surpriseMe}</>)}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{d.popularSearches}</p>
              <div className="flex flex-wrap gap-1">
                {popularSuggestions.map((suggestion) => (
                  <Badge key={suggestion} variant="secondary" className="cursor-pointer text-xs hover:bg-primary/10 transition-colors" onClick={() => setQuery(suggestion)}>{suggestion}</Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-xs">{currentStory.query}</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 w-8 p-0"><Share2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={clearStory} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown components={{
                h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium text-foreground mt-3 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="text-sm text-muted-foreground mb-3 pl-4 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="list-disc">{children}</li>,
              }}>{currentStory.story}</ReactMarkdown>
            </div>
            <Button variant="outline" size="sm" onClick={() => { clearStory(); setQuery(''); }} className="w-full">{d.searchAnotherStory}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
