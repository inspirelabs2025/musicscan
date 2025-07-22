import React, { useState } from 'react';
import { Hash, ArrowRight, Search, Link, Disc, Circle } from 'lucide-react';
import { extractDiscogsIdFromUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DiscogsIdInputProps {
  onSubmit: (discogsId: string, mediaType: 'vinyl' | 'cd') => void;
  isSearching?: boolean;
}

export const DiscogsIdInput = React.memo(({ onSubmit, isSearching = false }: DiscogsIdInputProps) => {
  const [discogsId, setDiscogsId] = useState('');
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd'>('vinyl');
  const [error, setError] = useState('');

  const processInput = (input: string): { id: string | null; error: string | null } => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return { id: null, error: 'Voer een Discogs ID of URL in' };
    }

    // Try to extract ID from URL first
    const extractedId = extractDiscogsIdFromUrl(trimmedInput);
    if (extractedId) {
      return { id: extractedId.toString(), error: null };
    }

    // If no ID extracted, check if it's a direct ID
    const idRegex = /^\d+$/;
    if (idRegex.test(trimmedInput) && parseInt(trimmedInput) > 0) {
      return { id: trimmedInput, error: null };
    }

    // If input looks like a URL but no ID found
    if (trimmedInput.includes('discogs.com') || trimmedInput.includes('/release/')) {
      return { id: null, error: 'Geen geldig Discogs ID gevonden in de URL' };
    }

    return { id: null, error: 'Voer een geldig Discogs ID (bijv. 588618) of URL in' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { id, error: processError } = processInput(discogsId);
    
    if (processError) {
      setError(processError);
      return;
    }

    if (id) {
      onSubmit(id, mediaType);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiscogsId(value);
    if (error) setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Link className="h-6 w-6" />
            Discogs ID/URL Invoer
          </CardTitle>
          <CardDescription>
            Voer een Discogs release ID of URL in voor snelle prijscheck
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="discogs-id">Discogs Release ID of URL</Label>
              <Input
                id="discogs-id"
                type="text"
                placeholder="588618 of https://www.discogs.com/release/588618"
                value={discogsId}
                onChange={handleInputChange}
                disabled={isSearching}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Voer een Discogs ID (bijv. <strong>588618</strong>) of volledige URL in
              </p>
            </div>

            <div className="space-y-3">
              <Label>Media Type</Label>
              <RadioGroup 
                value={mediaType} 
                onValueChange={(value: 'vinyl' | 'cd') => setMediaType(value)}
                className="flex flex-row gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vinyl" id="vinyl" />
                  <Label htmlFor="vinyl" className="flex items-center gap-2 cursor-pointer">
                    <Disc className="h-4 w-4" />
                    LP/Vinyl
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cd" id="cd" />
                  <Label htmlFor="cd" className="flex items-center gap-2 cursor-pointer">
                    <Circle className="h-4 w-4" />
                    CD
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSearching || !discogsId.trim()}
            >
            {isSearching ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Prijzen ophalen...
                </div>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ga naar prijscheck
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">💡 Hoe werkt dit?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Zoek je release op Discogs</li>
              <li>• Kopieer het ID uit de URL</li>
              <li>• Krijg direct actuele prijsinformatie</li>
              <li>• Sla het resultaat op in je collectie</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DiscogsIdInput.displayName = 'DiscogsIdInput';