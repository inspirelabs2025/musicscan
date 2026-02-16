import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScannerManualSearchProps {
  onSearch: (artist: string, title: string, barcode?: string, year?: string, country?: string, matrix?: string) => void;
  isSearching: boolean;
}

export const ScannerManualSearch = React.memo(({
  onSearch,
  isSearching,
}: ScannerManualSearchProps) => {
  const { tr } = useLanguage();
  const s = tr.scannerUI;
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
          {s.manualSearch}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ms-artist">{s.artist}</Label>
              <Input id="ms-artist" placeholder={s.artist} value={artist} onChange={(e) => setArtist(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-title">{s.albumTitle}</Label>
              <Input id="ms-title" placeholder={s.albumTitle} value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ms-year">{s.year}</Label>
              <Input id="ms-year" placeholder={s.yearExample} value={year} onChange={(e) => setYear(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-country">{s.country}</Label>
              <Input id="ms-country" placeholder={s.countryExample} value={country} onChange={(e) => setCountry(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ms-matrix">{s.matrixNumber}</Label>
              <Input id="ms-matrix" placeholder={s.matrixPlaceholder} value={matrix} onChange={(e) => setMatrix(e.target.value)} disabled={isSearching} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ms-barcode">{s.barcode}</Label>
              <Input id="ms-barcode" placeholder={s.barcodePlaceholder} value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={isSearching} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSearching || !hasInput}>
            {isSearching ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{s.searching}</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />{s.searchButton}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

ScannerManualSearch.displayName = 'ScannerManualSearch';
