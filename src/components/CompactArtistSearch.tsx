import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const CompactArtistSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
    setTimeout(() => setIsSearching(false), 300);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        {isSearching && (
          <Loader2 className="absolute right-16 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
        <Input
          type="text"
          placeholder="Zoek je favoriete artiest..."
          value={searchTerm}
          onChange={handleInputChange}
          className="pl-10 pr-24 h-10 bg-background/95 backdrop-blur border-border"
        />
        <Button
          type="submit"
          disabled={searchTerm.trim().length < 2}
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4"
        >
          Zoek
        </Button>
      </div>
    </form>
  );
};
