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
    <section className="relative overflow-hidden py-12 md:py-16">
      {/* Christmas gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-christmas-burgundy via-christmas-red to-christmas-gold/40" />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-christmas-gold/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-christmas-red/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-christmas-cream/10 rounded-full blur-3xl" />
      </div>

      {/* Snow particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-christmas-cream/40 animate-snowfall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              fontSize: `${8 + Math.random() * 8}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Heading */}
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🎵</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-christmas-cream via-christmas-gold to-christmas-cream bg-clip-text text-transparent drop-shadow-lg">
              Zoek alles van jouw favoriete artiest
            </h2>
            <p className="text-lg md:text-xl text-christmas-cream/90 max-w-2xl mx-auto">
              Doorzoek verhalen, producten, collecties en meer in één zoekopdracht
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-christmas-burgundy/60 group-focus-within:text-christmas-red transition-colors z-10" />
                
                {isSearching && (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-christmas-red animate-spin z-10" />
                )}
                
                <Input
                  type="text"
                  placeholder="Zoek je favoriete artiest..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="h-16 md:h-20 pl-16 pr-32 text-lg md:text-xl rounded-xl shadow-2xl border-2 border-christmas-gold/30 focus-visible:ring-2 focus-visible:ring-christmas-gold focus-visible:border-christmas-gold transition-all bg-christmas-cream/95 text-christmas-burgundy backdrop-blur placeholder:text-christmas-burgundy/50"
                />
                
                <Button
                  type="submit"
                  disabled={searchTerm.trim().length < 2}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-6 md:px-8 rounded-lg bg-gradient-to-r from-christmas-red to-christmas-burgundy hover:from-christmas-burgundy hover:to-christmas-red text-christmas-cream transition-all shadow-lg"
                >
                  <span className="hidden md:inline">Zoek</span>
                  <Search className="w-5 h-5 md:hidden" />
                </Button>
              </div>
              
              {/* Helper text */}
              <p className="text-sm text-christmas-cream/70 mt-3 text-left">
                Typ minimaal 2 karakters om te zoeken
              </p>
            </div>
          </form>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center items-center pt-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {[
              '🎵 Muziekverhalen',
              '🛍️ Shop Producten', 
              '💿 Collectie Items',
              '🎸 Nieuwe Releases',
              '👤 Artiest Info'
            ].map((badge, index) => (
              <div
                key={index}
                className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-christmas-cream/90 border border-christmas-gold/50 text-xs md:text-sm font-medium text-christmas-burgundy hover:bg-christmas-cream hover:border-christmas-gold transition-colors shadow-md"
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
