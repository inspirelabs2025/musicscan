import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMusicStoryGenerator } from '@/hooks/useMusicStoryGenerator';
import { Music, Search, BookOpen, Share2, X, Shuffle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const MusicStoryWidget = () => {
  const [query, setQuery] = useState('');
  const { generateStory, generateRandomStory, clearStory, isGenerating, currentStory } = useMusicStoryGenerator();

  const handleSearch = () => {
    if (query.trim()) {
      generateStory(query);
    }
  };

  const handleRandomSearch = () => {
    generateRandomStory();
  };

  const handleShare = () => {
    if (currentStory) {
      const shareText = `Het verhaal achter "${currentStory.query}":\n\n${currentStory.story.substring(0, 200)}...`;
      if (navigator.share) {
        navigator.share({
          title: `Het verhaal achter ${currentStory.query}`,
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  const popularSuggestions = [
    "Bohemian Rhapsody - Queen",
    "Hotel California - Eagles", 
    "Stairway to Heaven - Led Zeppelin",
    "Abbey Road - The Beatles",
    "The Dark Side of the Moon - Pink Floyd"
  ];

  return (
    <Card className="w-full h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Wat is het verhaal achter...</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentStory ? (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Voer een song, artiest of album in..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-10"
                />
                <Music className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isGenerating || !query.trim()}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Zoeken...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Zoek
                  </>
                )}
              </Button>
              <Button 
                onClick={handleRandomSearch} 
                disabled={isGenerating}
                size="sm"
                variant="outline"
                className="whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    AI kiest...
                  </>
                ) : (
                  <>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Verras Me!
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Populaire zoekopdrachten:</p>
              <div className="flex flex-wrap gap-1">
                {popularSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="secondary"
                    className="cursor-pointer text-xs hover:bg-primary/10 transition-colors"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-xs">
                {currentStory.query}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearStory}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium text-foreground mt-3 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-sm text-muted-foreground mb-3 pl-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="list-disc">{children}</li>
                  ),
                }}
              >
                {currentStory.story}
              </ReactMarkdown>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearStory();
                setQuery('');
              }}
              className="w-full"
            >
              Zoek een ander verhaal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};