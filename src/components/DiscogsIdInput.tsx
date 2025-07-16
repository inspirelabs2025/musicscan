import React, { useState } from 'react';
import { Hash, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiscogsIdInputProps {
  onSubmit: (discogsId: string) => void;
  isSearching?: boolean;
}

export const DiscogsIdInput = React.memo(({ onSubmit, isSearching = false }: DiscogsIdInputProps) => {
  const [discogsId, setDiscogsId] = useState('');
  const [error, setError] = useState('');

  const validateDiscogsId = (id: string): boolean => {
    const idRegex = /^\d+$/;
    return idRegex.test(id) && parseInt(id) > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!discogsId.trim()) {
      setError('Voer een Discogs ID in');
      return;
    }

    if (!validateDiscogsId(discogsId.trim())) {
      setError('Voer een geldig Discogs ID in (alleen cijfers)');
      return;
    }

    onSubmit(discogsId.trim());
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
            <Hash className="h-6 w-6" />
            Discogs ID Invoer
          </CardTitle>
          <CardDescription>
            Voer direct een Discogs release ID in voor snelle prijscheck
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discogs-id">Discogs Release ID</Label>
              <Input
                id="discogs-id"
                type="text"
                placeholder="Bijv. 588618"
                value={discogsId}
                onChange={handleInputChange}
                disabled={isSearching}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Je vindt het Discogs ID in de URL: discogs.com/release/<strong>588618</strong>
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSearching || !discogsId.trim()}
            >
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Prijzen ophalen...
                </>
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