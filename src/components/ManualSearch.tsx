import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';

interface ManualSearchProps {
  analysisResult: any;
  onResultsFound: (results: any[]) => void;
  mediaType: 'vinyl' | 'cd';
}

export const ManualSearch: React.FC<ManualSearchProps> = ({
  analysisResult,
  onResultsFound,
  mediaType
}) => {
  const [searchQuery, setSearchQuery] = useState({
    artist: analysisResult?.ocr_results?.artist || '',
    title: analysisResult?.ocr_results?.title || '',
    catalog: analysisResult?.ocr_results?.catalog_number || ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { searchCatalog, isSearching } = useDiscogsSearch();

  const handleSearch = async () => {
    if (!searchQuery.artist.trim() && !searchQuery.title.trim() && !searchQuery.catalog.trim()) {
      return;
    }
    
    try {
      const results = await searchCatalog(
        searchQuery.catalog,
        searchQuery.artist,
        searchQuery.title,
        true,
        true // force retry
      );
      
      if (results?.results?.length > 0) {
        onResultsFound(results.results);
      }
    } catch (error) {
      console.error('Manual search failed:', error);
    }
  };

  const handleQuickFix = (field: string, value: string) => {
    setSearchQuery(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Manual Search
        </CardTitle>
        <CardDescription>
          Search manually with corrected or alternative terms
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick diagnostics */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Detected Info:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {analysisResult?.ocr_results?.artist ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span>Artist: {analysisResult?.ocr_results?.artist || 'Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult?.ocr_results?.title ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span>Title: {analysisResult?.ocr_results?.title || 'Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult?.ocr_results?.catalog_number ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span>Catalog: {analysisResult?.ocr_results?.catalog_number || 'Missing'}</span>
            </div>
          </div>
        </div>

        {/* Basic search fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={searchQuery.artist}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="Enter artist name"
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={searchQuery.title}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter album/track title"
              />
            </div>
          </div>
          
          {showAdvanced && (
            <div>
              <Label htmlFor="catalog">Catalog Number</Label>
              <Input
                id="catalog"
                value={searchQuery.catalog}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, catalog: e.target.value }))}
                placeholder="Enter catalog number"
              />
            </div>
          )}
        </div>

        {/* Quick fix suggestions */}
        {analysisResult?.ocr_results && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
            
            {showAdvanced && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Try these fixes:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Check for OCR errors in artist/title</li>
                      <li>• Try searching without catalog number</li>
                      <li>• Try abbreviated artist names</li>
                      <li>• Check for alternative spellings</li>
                      {mediaType === 'cd' && (
                        <li>• Barcode not required - artist+title enough</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Search button */}
        <Button
          onClick={handleSearch}
          disabled={isSearching || (!searchQuery.artist.trim() && !searchQuery.title.trim() && !searchQuery.catalog.trim())}
          className="w-full"
        >
          {isSearching ? (
            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search Discogs
        </Button>
      </CardContent>
    </Card>
  );
};