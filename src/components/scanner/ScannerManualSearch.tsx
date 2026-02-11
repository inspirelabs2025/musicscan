import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ScannerManualSearchProps {
  onSearch: (artist: string, title: string, barcode?: string, year?: string, country?: string, matrix?: string) => void;
  isSearching: boolean;
}

export const ScannerManualSearch = React.memo(({
  onSearch,
  isSearching,
}: ScannerManualSearchProps) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('');
  const [matrix, setMatrix] = useState('');
  const [barcode, setBarcode] = useState('');

  const hasInput = artist.trim() || title.trim() || barcode.trim() || year.trim() || country.trim() || matrix.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInput) {
      onSearch(artist.trim(), title.trim(), barcode.trim(), year.trim(), country.trim(), matrix.trim());
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
            <div className="space-y-1">
              <Label htmlFor="ms-artist">Artiest</Label>
              <Input id="ms-artist" placeholder="Artiest" value={artist} onChange={(e) => setArtist(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-title">Album</Label>
              <Input id="ms-title" placeholder="Album titel" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ms-year">Jaartal</Label>
              <Input id="ms-year" placeholder="Bijv. 1996" value={year} onChange={(e) => setYear(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-country">Land</Label>
              <Input id="ms-country" placeholder="Bijv. UK, Germany" value={country} onChange={(e) => setCountry(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ms-matrix">Matrixnummer</Label>
              <Input id="ms-matrix" placeholder="Matrix / runout inscriptie" value={matrix} onChange={(e) => setMatrix(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-barcode">Barcode</Label>
              <Input id="ms-barcode" placeholder="Barcode (EAN/UPC)" value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSearching || !hasInput}>
            {isSearching ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Zoeken...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />Zoeken</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

ScannerManualSearch.displayName = 'ScannerManualSearch';
