import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Disc, Disc3, Hash, RotateCcw, Save, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUnifiedScan } from '@/hooks/useUnifiedScan';
import { ScannerUploadZone } from '@/components/scanner/ScannerUploadZone';
import { ScannerResultCard } from '@/components/scanner/ScannerResultCard';
import { ScannerPricePanel } from '@/components/scanner/ScannerPricePanel';
import { ScannerManualSearch } from '@/components/scanner/ScannerManualSearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const UnifiedScanner = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [discogsIdInput, setDiscogsIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);

  const {
    state,
    setMediaType,
    setMode,
    setCondition,
    setManualPrice,
    toggleManualPrice,
    addFile,
    removeFile,
    getRequiredPhotoCount,
    startAnalysis,
    searchByDiscogsId,
    searchManual,
    reset,
    getActivePrice,
  } = useUnifiedScan();

  // Handle URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'quick' || mode === 'shop') {
      setMode(mode);
    }
  }, [searchParams, setMode]);

  // Auto-start analysis when all photos uploaded
  useEffect(() => {
    const requiredCount = getRequiredPhotoCount();
    if (state.files.length === requiredCount && state.status === 'idle' && state.mediaType) {
      startAnalysis();
    }
  }, [state.files.length, state.status, state.mediaType, getRequiredPhotoCount, startAnalysis]);

  const handleDiscogsIdSubmit = useCallback(() => {
    const id = discogsIdInput.trim().replace(/[^0-9]/g, '');
    if (id) {
      searchByDiscogsId(id);
      setDiscogsIdInput('');
    }
  }, [discogsIdInput, searchByDiscogsId]);

  const handleSaveToCollection = useCallback(async () => {
    if (!user || !state.result) return;

    setIsSaving(true);
    try {
      const price = getActivePrice();
      
      const { error } = await supabase.from('vinyl_collection').insert({
        user_id: user.id,
        artist: state.result.artist,
        title: state.result.title,
        label: state.result.label,
        catalog_number: state.result.catalog_number,
        year: state.result.year,
        format: state.result.format || (state.mediaType === 'cd' ? 'CD' : 'Vinyl'),
        genre: state.result.genre,
        country: state.result.country,
        discogs_id: state.result.discogs_id,
        discogs_url: state.result.discogs_url,
        cover_image: state.result.cover_image,
        condition_grade: state.condition,
        calculated_advice_price: price,
        lowest_price: state.result.pricing_stats?.lowest_price ? parseFloat(state.result.pricing_stats.lowest_price) : null,
        median_price: state.result.pricing_stats?.median_price ? parseFloat(state.result.pricing_stats.median_price) : null,
        highest_price: state.result.pricing_stats?.highest_price ? parseFloat(state.result.pricing_stats.highest_price) : null,
      });

      if (error) throw error;

      toast({
        title: 'Opgeslagen!',
        description: `${state.result.artist} - ${state.result.title} toegevoegd aan je collectie`,
      });

      reset();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Opslaan mislukt',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, state, getActivePrice, reset]);

  const handleSaveToShop = useCallback(async () => {
    if (!user || !state.result) return;

    setIsSaving(true);
    try {
      const price = getActivePrice();
      const tableName = state.mediaType === 'cd' ? 'cd_scan' : 'vinyl_collection';
      
      const { error } = await supabase.from(tableName).insert({
        user_id: user.id,
        artist: state.result.artist,
        title: state.result.title,
        label: state.result.label,
        catalog_number: state.result.catalog_number,
        year: state.result.year,
        format: state.result.format || (state.mediaType === 'cd' ? 'CD' : 'Vinyl'),
        genre: state.result.genre,
        country: state.result.country,
        discogs_id: state.result.discogs_id,
        discogs_url: state.result.discogs_url,
        ...(tableName === 'vinyl_collection' ? { cover_image: state.result.cover_image } : {}),
        condition_grade: state.condition,
        calculated_advice_price: price,
        lowest_price: state.result.pricing_stats?.lowest_price ? parseFloat(state.result.pricing_stats.lowest_price) : null,
        median_price: state.result.pricing_stats?.median_price ? parseFloat(state.result.pricing_stats.median_price) : null,
        highest_price: state.result.pricing_stats?.highest_price ? parseFloat(state.result.pricing_stats.highest_price) : null,
        is_for_sale: true,
        marketplace_price: price,
        marketplace_status: 'draft',
      });

      if (error) throw error;

      toast({
        title: 'Opgeslagen voor Shop!',
        description: `${state.result.artist} - ${state.result.title} klaar voor verkoop`,
      });

      reset();
    } catch (error: any) {
      console.error('Save to shop error:', error);
      toast({
        title: 'Opslaan mislukt',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, state, getActivePrice, reset]);

  const isComplete = state.status === 'complete' && state.result;
  const isProcessing = state.status === 'analyzing' || state.status === 'searching';
  const canSave = isComplete && state.condition && (getActivePrice() !== null || !state.result?.pricing_stats?.lowest_price);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Scan Album</h1>
            <p className="text-muted-foreground text-sm">
              Foto's uploaden → automatische herkenning → prijsadvies
            </p>
          </div>
          {(state.mediaType || state.result) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Opnieuw
            </Button>
          )}
        </div>

        {/* Step 1: Media type selection */}
        {!state.mediaType && !state.discogsId && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wat wil je scannen?</CardTitle>
                <CardDescription>Kies het type media of voer een Discogs ID in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMediaType('vinyl')}
                    className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2"
                  >
                    <Disc className="h-12 w-12 mx-auto text-primary" />
                    <div className="font-semibold">Vinyl</div>
                    <div className="text-sm text-muted-foreground">3 foto's nodig</div>
                  </button>
                  <button
                    onClick={() => setMediaType('cd')}
                    className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2"
                  >
                    <Disc3 className="h-12 w-12 mx-auto text-primary" />
                    <div className="font-semibold">CD</div>
                    <div className="text-sm text-muted-foreground">4 foto's nodig</div>
                  </button>
                </div>

                {/* Discogs ID input */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">of</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Discogs ID (bijv. 12345678)"
                      value={discogsIdInput}
                      onChange={(e) => setDiscogsIdInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDiscogsIdSubmit()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleDiscogsIdSubmit} disabled={!discogsIdInput.trim()}>
                    Zoeken
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Upload zone (always visible when media type selected) */}
        {state.mediaType && !isComplete && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {state.mediaType === 'vinyl' ? <Disc className="h-5 w-5" /> : <Disc3 className="h-5 w-5" />}
                {state.mediaType === 'vinyl' ? 'Vinyl' : 'CD'} Scannen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScannerUploadZone
                mediaType={state.mediaType}
                files={state.files}
                onFileAdd={addFile}
                onFileRemove={removeFile}
                isAnalyzing={isProcessing}
                requiredCount={getRequiredPhotoCount()}
              />
            </CardContent>
          </Card>
        )}

        {/* Result section - shows inline */}
        {(isProcessing || isComplete) && (
          <div className="space-y-4">
            {/* Album result card */}
            <ScannerResultCard result={state.result} status={state.status} />

            {/* Manual search fallback */}
            {isComplete && !state.result?.discogs_id && (
              <div className="space-y-3">
                {!showManualSearch ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowManualSearch(true)}
                  >
                    Geen match? Zoek handmatig
                  </Button>
                ) : (
                  <ScannerManualSearch
                    onSearch={searchManual}
                    isSearching={state.status === 'searching'}
                  />
                )}
              </div>
            )}

            {/* Price panel - only after we have results */}
            {isComplete && state.result && (
              <ScannerPricePanel
                mediaType={state.mediaType || 'vinyl'}
                pricingStats={state.result.pricing_stats}
                condition={state.condition}
                advicePrice={state.advicePrice}
                manualPrice={state.manualPrice}
                useManualPrice={state.useManualPrice}
                onConditionChange={setCondition}
                onManualPriceChange={setManualPrice}
                onToggleManualPrice={toggleManualPrice}
              />
            )}

            {/* Action buttons */}
            {isComplete && state.result && state.condition && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveToCollection}
                  disabled={!canSave || isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>Opslaan...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Collectie
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveToShop}
                  disabled={!canSave || isSaving}
                  variant="secondary"
                  className="w-full"
                >
                  {isSaving ? (
                    <>Opslaan...</>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Shop
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Quick price mode - just show price, no save */}
            {state.mode === 'quick' && isComplete && (
              <div className="text-center text-sm text-muted-foreground">
                <Button variant="link" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Nieuwe prijscheck
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Back button when in process */}
        {state.mediaType && !isComplete && state.files.length === 0 && (
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => setMediaType(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
        )}
      </main>
    </div>
  );
};

export default UnifiedScanner;
