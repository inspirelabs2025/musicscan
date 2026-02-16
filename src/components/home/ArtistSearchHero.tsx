import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const ArtistSearchHero = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const m = tr.miscUI;

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
    <section className="relative py-6 md:py-8">
      <div className="container mx-auto px-4">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-green-600 transition-colors z-10" />
            
            {isSearching && (
              <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600 animate-spin z-10" />
            )}
            
            <Input
              type="text"
              placeholder={m.searchPlaceholder}
              value={searchTerm}
              onChange={handleInputChange}
              className="h-14 pl-14 pr-28 text-base rounded-full shadow-lg border-2 border-green-200/50 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:border-green-400 transition-all bg-background text-foreground placeholder:text-muted-foreground"
            />
            
            <Button
              type="submit"
              disabled={searchTerm.trim().length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition-all shadow-md"
            >
              {m.searchButton}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
