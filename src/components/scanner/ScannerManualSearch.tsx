import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ScannerManualSearchProps {
  onSearch: (artist: string, title: string, catalogNumber?: string) => void;
  isSearching: boolean;
}

export const ScannerManualSearch = React.memo(({
  onSearch,
  isSearching,
}: ScannerManualSearchProps) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (artist.trim() || title.trim() || catalogNumber.trim()) {
      onSearch(artist.trim(), title.trim(), catalogNumber.trim());
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" />
          Handmatig zoeken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Artiest"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isSearching}
            />
            <Input
              placeholder="Album titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Input
            placeholder="Catalogusnummer (optioneel)"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
            disabled={isSearching}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={isSearching || (!artist.trim() && !title.trim() && !catalogNumber.trim())}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Zoeken...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Zoeken
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

ScannerManualSearch.displayName = 'ScannerManualSearch';
