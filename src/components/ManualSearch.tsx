import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManualSearchProps {
  analysisResult: any;
  onResultsFound: (results: any[]) => void;
  mediaType: 'vinyl' | 'cd';
  onBack?: () => void;
}

export const ManualSearch: React.FC<ManualSearchProps> = ({ analysisResult, onResultsFound, mediaType, onBack }) => {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const [searchQuery, setSearchQuery] = useState({
    artist: analysisResult?.analysis?.artist || '',
    title: analysisResult?.analysis?.title || '',
    catalog: analysisResult?.analysis?.catalog_number || ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { searchCatalog, isSearching } = useDiscogsSearch();

  const handleSearch = async () => {
    if (!searchQuery.artist.trim() && !searchQuery.title.trim() && !searchQuery.catalog.trim()) return;
    try {
      const results = await searchCatalog(searchQuery.catalog, searchQuery.artist, searchQuery.title, true, true);
      if (results?.results?.length > 0) onResultsFound(results.results);
    } catch (error) { console.error('Manual search failed:', error); }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />{sc.manualSearchTitle}
        </CardTitle>
        <CardDescription>{sc.manualSearchDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{sc.detectedInfo}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {analysisResult?.analysis?.artist ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span>{sc.artist}: {analysisResult?.analysis?.artist || sc.missing}</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult?.analysis?.title ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span>{sc.titel}: {analysisResult?.analysis?.title || sc.missing}</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult?.analysis?.catalog_number ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span>{sc.catalogNumber}: {analysisResult?.analysis?.catalog_number || sc.missing}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="artist">{sc.artist}</Label>
              <Input id="artist" value={searchQuery.artist} onChange={(e) => setSearchQuery(prev => ({ ...prev, artist: e.target.value }))} placeholder={sc.enterArtist} />
            </div>
            <div>
              <Label htmlFor="title">{sc.titel}</Label>
              <Input id="title" value={searchQuery.title} onChange={(e) => setSearchQuery(prev => ({ ...prev, title: e.target.value }))} placeholder={sc.enterTitle} />
            </div>
          </div>
          {showAdvanced && (
            <div>
              <Label htmlFor="catalog">{sc.catalogNumber}</Label>
              <Input id="catalog" value={searchQuery.catalog} onChange={(e) => setSearchQuery(prev => ({ ...prev, catalog: e.target.value }))} placeholder={sc.enterCatalog} />
            </div>
          )}
        </div>

        {analysisResult?.analysis && (
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-blue-600">
              {showAdvanced ? sc.hideAdvanced : sc.showAdvanced}
            </Button>
            {showAdvanced && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{sc.tryFixes}</p>
                    <ul className="text-sm space-y-1">
                      <li>• {sc.checkOcrErrors}</li>
                      <li>• {sc.tryWithoutCatalog}</li>
                      <li>• {sc.tryAbbreviated}</li>
                      <li>• {sc.checkSpellings}</li>
                      {mediaType === 'cd' && <li>• {sc.barcodeNotRequired}</li>}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack} disabled={isSearching}>
              <ArrowLeft className="h-4 w-4 mr-2" />{sc.back}
            </Button>
          )}
          <Button onClick={handleSearch} disabled={isSearching || (!searchQuery.artist.trim() && !searchQuery.title.trim() && !searchQuery.catalog.trim())} className="flex-1">
            {isSearching ? <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {sc.searchDiscogs}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
