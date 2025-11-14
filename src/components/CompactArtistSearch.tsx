import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const CompactArtistSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      navigate(`/search/artist?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsExpanded(false);
      setSearchTerm('');
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (!searchTerm) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className={cn(
        "flex items-center gap-2 transition-all duration-300",
        isExpanded ? "w-64 md:w-80" : "w-10"
      )}>
        {!isExpanded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleExpand}
            className="hover:bg-vinyl-purple/10"
            title="Zoek artiest"
          >
            <Search className="w-4 h-4" />
          </Button>
        ) : (
          <div className="relative w-full flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              )}
              <Input
                ref={inputRef}
                type="text"
                placeholder="Zoek artiest..."
                value={searchTerm}
                onChange={handleInputChange}
                className="pl-9 pr-9 h-9 text-sm bg-background/95 backdrop-blur border-border"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCollapse}
              className="h-9 w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
