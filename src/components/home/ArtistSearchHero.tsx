import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';

export const ArtistSearchHero = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounceSearch(searchTerm, 500);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      navigate(`/search/artist?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 500);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-vinyl-purple/20 via-vinyl-gold/20 to-accent/20 py-16 md:py-24">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vinyl-purple/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vinyl-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Heading */}
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="w-8 h-8 text-vinyl-gold" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-vinyl-purple via-vinyl-gold to-accent bg-clip-text text-transparent">
              Zoek alles van jouw favoriete artiest
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Doorzoek verhalen, producten, collecties en meer in één zoekopdracht
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                
                {isSearching && (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin z-10" />
                )}
                
                <Input
                  type="text"
                  placeholder="Zoek je favoriete artiest..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="h-16 md:h-20 pl-16 pr-32 text-lg md:text-xl rounded-xl shadow-lg border-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all bg-background/95 backdrop-blur"
                />
                
                <Button
                  type="submit"
                  disabled={searchTerm.trim().length < 2}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-6 md:px-8 rounded-lg bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:opacity-90 transition-opacity"
                >
                  <span className="hidden md:inline">Zoek</span>
                  <Search className="w-5 h-5 md:hidden" />
                </Button>
              </div>
              
              {/* Helper text */}
              <p className="text-sm text-muted-foreground mt-3 text-left">
                Typ minimaal 2 karakters om te zoeken
              </p>
            </div>
          </form>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 justify-center items-center pt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {[
              '🎵 Muziekverhalen',
              '🛍️ Shop Producten', 
              '💿 Collectie Items',
              '🎸 Nieuwe Releases',
              '👤 Artiest Info'
            ].map((badge, index) => (
              <div
                key={index}
                className="px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-sm font-medium hover:border-primary/50 transition-colors"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
