import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
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
      {/* Red & Green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-800 via-red-700 to-green-800" />
      
      {/* Decorative glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Heading with Christmas icon */}
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🎄</span>
              <span className="text-sm font-medium text-green-200 uppercase tracking-wider">Muziekplatform</span>
              <span className="text-2xl">🎄</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
              Zoek alles van jouw favoriete artiest
            </h2>
            <p className="text-lg md:text-xl text-green-100/90 max-w-2xl mx-auto">
              Doorzoek verhalen, producten, collecties en meer in één zoekopdracht
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-green-700/60 group-focus-within:text-green-600 transition-colors z-10" />
                
                {isSearching && (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600 animate-spin z-10" />
                )}
                
                <Input
                  type="text"
                  placeholder="Zoek je favoriete artiest..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="h-16 md:h-20 pl-16 pr-32 text-lg md:text-xl rounded-xl shadow-2xl border-2 border-green-500/30 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:border-green-400 transition-all bg-white/95 text-gray-900 backdrop-blur placeholder:text-gray-500"
                />
                
                <Button
                  type="submit"
                  disabled={searchTerm.trim().length < 2}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-6 md:px-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition-all shadow-lg"
                >
                  <span className="hidden md:inline">Zoek</span>
                  <Search className="w-5 h-5 md:hidden" />
                </Button>
              </div>
              
              {/* Helper text */}
              <p className="text-sm text-green-200/70 mt-3 text-left">
                Typ minimaal 2 karakters om te zoeken
              </p>
            </div>
          </form>

          {/* Feature badges with small Christmas icons */}
          <div className="flex flex-wrap gap-2 justify-center items-center pt-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: '🎵', label: 'Muziekverhalen' },
              { icon: '🎁', label: 'Shop Producten' }, 
              { icon: '💿', label: 'Collectie Items' },
              { icon: '🎸', label: 'Nieuwe Releases' },
              { icon: '⭐', label: 'Artiest Info' }
            ].map((badge, index) => (
              <div
                key={index}
                className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-white/90 border border-green-300/50 text-xs md:text-sm font-medium text-green-800 hover:bg-white hover:border-green-400 transition-colors shadow-md"
              >
                {badge.icon} {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
