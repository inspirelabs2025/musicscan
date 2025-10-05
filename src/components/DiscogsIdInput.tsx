import React, { useState, useEffect } from 'react';
import { ArrowRight, Link, Disc, Circle, ArrowLeft } from 'lucide-react';
import { extractDiscogsIdFromUrl, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DiscogsIdInputProps {
  onSubmit: (discogsId: string, mediaType: 'vinyl' | 'cd') => void;
  isSearching?: boolean;
  prefilledDiscogsId?: string;
  prefilledMediaType?: 'vinyl' | 'cd';
  onBack?: () => void;
}

export const DiscogsIdInput = React.memo(({ onSubmit, isSearching = false, prefilledDiscogsId, prefilledMediaType, onBack }: DiscogsIdInputProps) => {
  const [discogsId, setDiscogsId] = useState(prefilledDiscogsId || '');
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | null>(prefilledMediaType || null);
  const [error, setError] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Initialize with prefilled values when component mounts
  useEffect(() => {
    if (prefilledDiscogsId) {
      setDiscogsId(prefilledDiscogsId);
    }
    if (prefilledMediaType) {
      setMediaType(prefilledMediaType);
    }
  }, [prefilledDiscogsId, prefilledMediaType]);

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
    setHasInteracted(true);
    setError('');

    // Check if media type is selected
    if (!mediaType) {
      setError('Selecteer eerst LP/Vinyl of CD');
      return;
    }

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

  // Use string type to handle empty string case better
  const handleMediaTypeChange = (value: string) => {
    console.log('Media type changed to:', value);
    if (value === '') {
      setMediaType(null);
    } else {
      setMediaType(value as 'vinyl' | 'cd');
    }
    setHasInteracted(true);
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
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center">
                Media Type <span className="text-destructive ml-1 font-bold">*</span>
              </Label>
              <RadioGroup 
                key="media-type-selector"
                defaultValue=""
                value={mediaType || ''}
                onValueChange={handleMediaTypeChange}
                className={cn(
                  "flex flex-row gap-6 border p-3 rounded-lg transition-all",
                  ((hasInteracted && !mediaType) || (error && error.includes("Selecteer eerst"))) 
                    ? "border-destructive ring-2 ring-destructive/30" 
                    : mediaType ? "border-primary/30" : "border-input"
                )}
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
              {((hasInteracted && !mediaType) || (error && error.includes("Selecteer eerst"))) && (
                <p className="text-xs text-destructive font-medium">
                  Je moet eerst een media type selecteren
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Selecteer het type media dat je wilt scannen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discogs-id">Discogs Release ID of URL</Label>
              <Input
                id="discogs-id"
                type="text"
                placeholder="588618 of https://www.discogs.com/release/588618"
                value={discogsId}
                onChange={handleInputChange}
                disabled={isSearching}
                className={error && !error.includes("Selecteer eerst") ? 'border-destructive' : ''}
              />
              {error && !error.includes("Selecteer eerst") && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Voer een Discogs ID (bijv. <strong>588618</strong>) of volledige URL in
              </p>
            </div>
            
            <div className="flex gap-3">
              {onBack && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSearching}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSearching || !discogsId.trim() || !mediaType}
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
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">💡 Hoe werkt dit?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Kies eerst LP/Vinyl of CD</li>
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