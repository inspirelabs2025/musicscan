import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Brain, CheckCircle, AlertCircle, Clock, Sparkles, ShoppingCart, RefreshCw, Euro, TrendingUp, TrendingDown, Loader2, Info, Camera, Disc } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useSubscription } from '@/hooks/useSubscription';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { ScannerPhotoPreview, MatrixVerificationStep, CDPhotoTips } from '@/components/scanner';
import type { MatrixVerificationData, MatrixCharacter } from '@/components/scanner';
import { preprocessImageClient, preprocessCDImageClient } from '@/utils/clientImagePreprocess';
import testCdMatrix from '@/assets/test-cd-matrix.jpg';

// Simple V2 components for media type and condition selection

interface UploadedFile {
  file: File;
  preview: string;
  processedPreview?: string;
  processingStats?: {
    contrastApplied: boolean;
    wasResized: boolean;
    processingTimeMs: number;
  };
  id: string;
}
interface AnalysisResult {
  scanId: string;
  result: {
    discogs_id: number | null;
    discogs_url: string | null;
    artist: string | null;
    title: string | null;
    label: string | null;
    catalog_number: string | null;
    year: number | null;
    confidence_score: number;
    ai_description: string;
    image_quality?: string;
    extracted_details?: any;
    artwork_url?: string | null;
    // Technical identifiers
    matrix_number?: string | null;
    sid_code_mastering?: string | null;
    sid_code_mould?: string | null;
    label_code?: string | null;
    barcode?: string | null;
    genre?: string | null;
    country?: string | null;
    // Matrix verification data
    matrix_characters?: MatrixCharacter[];
    needs_verification?: boolean;
    overall_matrix_confidence?: number;
    // Pricing from Discogs (now included in V2 response)
    pricing_stats?: {
      lowest_price: number | null;
      median_price: number | null;
      highest_price: number | null;
      num_for_sale: number;
      currency: string;
      blocked?: boolean;
      blocked_reason?: string;
    } | null;
  };
  version: string;
}
export default function AIScanV2() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get params from URL (from Matrix Enhancer)
  const fromEnhancer = searchParams.get('fromEnhancer') === 'true';
  const urlMediaType = searchParams.get('mediaType') as 'vinyl' | 'cd' | null;
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>(urlMediaType || '');
  const [conditionGrade, setConditionGrade] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Pre-filled matrix, IFPI codes, and photo from Matrix Enhancer
  const [prefilledMatrix, setPrefilledMatrix] = useState<string | null>(null);
  const [prefilledIfpiCodes, setPrefilledIfpiCodes] = useState<string[]>([]);
  const [fromMatrixEnhancer, setFromMatrixEnhancer] = useState(false);
  
  // Matrix verification state
  const [verificationStep, setVerificationStep] = useState<'pending' | 'verifying' | 'verified' | 'skipped'>('pending');
  const [verifiedMatrixNumber, setVerifiedMatrixNumber] = useState<string | null>(null);
  
  // Load data from Matrix Enhancer via sessionStorage
  useEffect(() => {
    if (fromEnhancer) {
      try {
        const storedData = sessionStorage.getItem('matrixEnhancerData');
        if (storedData) {
          const data = JSON.parse(storedData);
          // Check if data is recent (within 5 minutes)
          if (Date.now() - data.timestamp < 5 * 60 * 1000) {
            setPrefilledMatrix(data.matrix);
            setFromMatrixEnhancer(true);
            
            // Load IFPI codes if available
            if (data.ifpiCodes && Array.isArray(data.ifpiCodes)) {
              setPrefilledIfpiCodes(data.ifpiCodes);
            }
            
            // NEW: If Discogs match exists, show it directly (skip re-analysis)
            if (data.discogsMatch) {
              setAnalysisResult({
                scanId: `enhancer-${Date.now()}`,
                result: {
                  discogs_id: data.discogsMatch.discogs_id,
                  discogs_url: data.discogsMatch.discogs_url,
                  artist: data.discogsMatch.artist,
                  title: data.discogsMatch.title,
                  label: data.discogsMatch.label,
                  catalog_number: data.discogsMatch.catalog_number,
                  year: data.discogsMatch.year,
                  confidence_score: data.discogsMatch.match_confidence,
                  ai_description: `Matrix match via CD Matrix Enhancer`,
                  matrix_number: data.matrix,
                  country: data.discogsMatch.country,
                  genre: data.discogsMatch.genre,
                  artwork_url: data.discogsMatch.cover_image,
                },
                version: 'enhancer-v1'
              });
              // Skip verification - already verified in enhancer
              setVerificationStep('verified');
              setVerifiedMatrixNumber(data.matrix);
              
              toast({
                title: "✅ Discogs match geladen",
                description: `${data.discogsMatch.artist} - ${data.discogsMatch.title}`,
              });
            }
            
            // Convert base64 to File and add to uploadedFiles
            if (data.photo) {
              fetch(data.photo)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'matrix-enhancer-photo.jpg', { type: 'image/jpeg' });
                  const id = Math.random().toString(36).substr(2, 9);
                  setUploadedFiles([{
                    file,
                    preview: data.photo,
                    id
                  }]);
                });
            }
            
            // Only show "selecteer conditie" toast if no Discogs match was loaded
            if (!data.discogsMatch) {
              const ifpiText = data.ifpiCodes?.length > 0 ? ` + ${data.ifpiCodes.length} IFPI` : '';
              toast({
                title: "Foto en matrix code geladen",
                description: `Selecteer een conditie om direct te starten${ifpiText}`,
              });
            }
          }
          // Clear sessionStorage after reading
          sessionStorage.removeItem('matrixEnhancerData');
        }
      } catch (e) {
        console.error('Failed to load matrix enhancer data:', e);
      }
      // Clear URL params
      setSearchParams({});
    }
  }, [fromEnhancer]);
  
  const {
    checkUsageLimit,
    incrementUsage
  } = useUsageTracking();
  const {
    subscription
  } = useSubscription();

  // Discogs search for automatic pricing
  const {
    searchByDiscogsId,
    searchResults,
    isPricingLoading,
    retryPricing,
    resetSearchState
  } = useDiscogsSearch();

  // Auto-trigger price check when analysis finds a Discogs ID
  useEffect(() => {
    if (analysisResult?.result?.discogs_id) {
      console.log('🔍 Auto-triggering price check for Discogs ID:', analysisResult.result.discogs_id);
      searchByDiscogsId(analysisResult.result.discogs_id.toString());
    }
  }, [analysisResult?.result?.discogs_id, searchByDiscogsId]);

  // Auto-trigger matrix verification when analysis completes with uncertain characters
  useEffect(() => {
    if (analysisResult && analysisResult.result.needs_verification && verificationStep === 'pending') {
      console.log('🔍 Matrix needs verification, showing verification step');
      setVerificationStep('verifying');
    } else if (analysisResult && !analysisResult.result.needs_verification && verificationStep === 'pending') {
      // High confidence - skip verification
      setVerificationStep('verified');
      setVerifiedMatrixNumber(analysisResult.result.matrix_number || null);
    }
  }, [analysisResult, verificationStep]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        
        // First, read the file as data URL for original preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          const originalPreview = e.target?.result as string;
          
          // Add file immediately with original preview
          const newFile: UploadedFile = {
            file,
            preview: originalPreview,
            id
          };
          setUploadedFiles(prev => [...prev, newFile]);
          
          // Process with standard preprocessing
          try {
            const preprocessResult = mediaType === 'cd' 
              ? await preprocessCDImageClient(file, {
                  maxDimension: 1600,
                  applyContrast: true,
                  quality: 0.85,
                  applyCDMatrixFilter: true
                })
              : await preprocessImageClient(file, {
                  maxDimension: 1600,
                  applyContrast: true,
                  quality: 0.85
                });
            
            // Update the file with processed preview
            setUploadedFiles(prev => prev.map(f => 
              f.id === id 
                ? {
                    ...f,
                    processedPreview: preprocessResult.processedImage,
                    processingStats: {
                      contrastApplied: preprocessResult.stats.contrastApplied,
                      wasResized: preprocessResult.stats.wasResized,
                      processingTimeMs: preprocessResult.stats.processingTimeMs
                    }
                  }
                : f
            ));
            
            // Show feedback for CD filtering
            if (mediaType === 'cd' && 'cdFilterStats' in preprocessResult && preprocessResult.cdFilterStats) {
              const stats = preprocessResult.cdFilterStats as { reflectionPixelsFiltered: number; avgColorVariation: number };
              if (stats.avgColorVariation > 40) {
                toast({
                  title: "Reflecties gedetecteerd",
                  description: `${stats.reflectionPixelsFiltered.toLocaleString()} pixels gefilterd voor betere matrix herkenning.`,
                });
              }
            }
          } catch (err) {
            console.warn('Preprocessing failed, using original:', err);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }, [mediaType]);
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  }, []);
  const uploadToSupabase = async (file: File): Promise<string> => {
    // Generate unique filename with timestamp + random ID to prevent "resource already exists" errors on mobile
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `ai-scan-v2/${Date.now()}-${uniqueId}-${safeFileName}`;
    const {
      data,
      error
    } = await supabase.storage.from('vinyl_images').upload(fileName, file, {
      upsert: true
    });
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('vinyl_images').getPublicUrl(fileName);
    return publicUrl;
  };
  const startAnalysis = async () => {
    if (!user) {
      toast({
        title: "Niet ingelogd",
        description: "Je moet ingelogd zijn om de AI analyse te gebruiken.",
        variant: "destructive"
      });
      return;
    }
    if (uploadedFiles.length === 0) {
      toast({
        title: "Geen bestanden",
        description: "Upload eerst één of meer foto's om te analyseren.",
        variant: "destructive"
      });
      return;
    }

    // Add validation for media type
    if (!mediaType) {
      toast({
        title: "Geen media type geselecteerd",
        description: "Selecteer eerst een media type (Vinyl of CD).",
        variant: "destructive"
      });
      return;
    }

    // Add validation for condition grade
    if (!conditionGrade) {
      toast({
        title: "Geen conditie geselecteerd",
        description: "Selecteer eerst een conditie voor je item.",
        variant: "destructive"
      });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);
    setAnalysisResult(null);
    try {
      // Check usage limits before proceeding
      const usageCheck = await checkUsageLimit('ai_scans');
      if (!usageCheck.can_use) {
        setShowUpgradePrompt(true);
        setIsAnalyzing(false);
        return;
      }

      // Upload images
      setAnalysisProgress(20);
      console.log('📤 Uploading images to Supabase storage...');
      const photoUrls = await Promise.all(uploadedFiles.map(({
        file
      }) => uploadToSupabase(file)));
      console.log('✅ Images uploaded successfully:', photoUrls);
      setAnalysisProgress(40);

      // Get current session for authentication
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }
      console.log('🔐 Using session for authentication:', {
        userId: session.user.id,
        email: session.user.email
      });

      // Call the V2 AI analysis function
      console.log('🤖 Calling AI analysis V2 function...');
      if (prefilledMatrix) {
        console.log('📎 Using prefilled matrix from Matrix Enhancer:', prefilledMatrix);
      }
      if (prefilledIfpiCodes.length > 0) {
        console.log('📎 Using prefilled IFPI codes from Matrix Enhancer:', prefilledIfpiCodes);
      }
      const {
        data,
        error: functionError
      } = await supabase.functions.invoke('ai-photo-analysis-v2', {
        body: {
          photoUrls,
          mediaType,
          conditionGrade,
          prefilledMatrix: prefilledMatrix || undefined,
          prefilledIfpiCodes: prefilledIfpiCodes.length > 0 ? prefilledIfpiCodes : undefined
        }
      });
      console.log('📊 Function response:', {
        data,
        error: functionError
      });
      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(functionError.message || 'Function call failed');
      }
      if (!data) {
        throw new Error('No data received from function');
      }
      if (!data.success) {
        console.error('❌ Analysis failed:', data.error);
        throw new Error(data.error || 'Analysis failed');
      }
      setAnalysisProgress(100);
      setAnalysisResult(data);

      // Increment usage after successful analysis
      await incrementUsage('ai_scans');
      console.log('✅ Analysis completed successfully');
      toast({
        title: "Analyse voltooid!",
        description: `V2 analyse succesvol afgerond met ${Math.round(data.result.confidence_score * 100)}% vertrouwen.`
      });
    } catch (err) {
      console.error('❌ Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Analyse mislukt",
        description: `Fout: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  const resetForm = () => {
    setUploadedFiles([]);
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);
    setVerificationStep('pending');
    setVerifiedMatrixNumber(null);
    setPrefilledMatrix(null);
    setPrefilledIfpiCodes([]);
    setFromMatrixEnhancer(false);
    resetSearchState();
  };

  // Handle matrix verification completion
  const handleMatrixVerified = useCallback(async (
    verifiedMatrix: string, 
    corrections: Array<{ position: number; original: string; corrected: string }>
  ) => {
    setVerifiedMatrixNumber(verifiedMatrix);
    setVerificationStep('verified');
    
    // Save corrections to database for training
    if (corrections.length > 0 && analysisResult?.scanId && user) {
      try {
        const { error: saveError } = await supabase
          .from('matrix_corrections')
          .insert({
            scan_id: analysisResult.scanId,
            original_matrix: analysisResult.result.matrix_number || '',
            corrected_matrix: verifiedMatrix,
            character_corrections: corrections,
            media_type: mediaType,
            user_id: user.id
          });
        
        if (saveError) {
          console.error('Failed to save matrix correction:', saveError);
        } else {
          console.log('✅ Matrix correction saved for training');
          toast({
            title: "Correctie opgeslagen",
            description: "Bedankt! Je correctie helpt de herkenning te verbeteren."
          });
        }
      } catch (err) {
        console.error('Error saving correction:', err);
      }
    }
  }, [analysisResult, mediaType, user]);

  // Handle skipping verification
  const handleSkipVerification = useCallback(() => {
    setVerificationStep('skipped');
    setVerifiedMatrixNumber(analysisResult?.result.matrix_number || null);
  }, [analysisResult]);

  // Simulate progress during analysis
  useEffect(() => {
    if (isAnalyzing && analysisProgress < 90) {
      const timer = setTimeout(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 90));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, analysisProgress]);

  // Show loading while checking auth
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>;
  }
  return <>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">

      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <Brain className="h-8 w-8" />
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Smart Foto Analyse V2
              <Badge variant="secondary" className="ml-2">BETA</Badge>
            </h1>
            <p className="text-muted-foreground">
              Ontdek supersnel de juiste release ID - verbeterde analyse met GPT-4.1 en multi-pass technologie
            </p>
            {user && <p className="text-sm text-muted-foreground">
                Ingelogd als: {user.email}
              </p>}
          </div>

        {!analysisResult && <>
            {/* Media Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Media Type <span className="text-red-500">*</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecteer media type (verplicht)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant={mediaType === 'vinyl' ? 'default' : 'outline'} onClick={() => setMediaType('vinyl')} className={`h-16 flex flex-col gap-1 ${!mediaType ? 'border-red-300' : ''}`}>
                      <span className="font-medium">Vinyl</span>
                      <span className="text-xs">LP / Single / EP</span>
                    </Button>
                    <Button variant={mediaType === 'cd' ? 'default' : 'outline'} onClick={() => setMediaType('cd')} className={`h-16 flex flex-col gap-1 ${!mediaType ? 'border-red-300' : ''}`}>
                      <span className="font-medium">CD</span>
                      <span className="text-xs">Album / Single</span>
                    </Button>
                  </div>
                  {!mediaType && <p className="text-sm text-red-600">Een media type selectie is verplicht</p>}
                </div>
              </CardContent>
            </Card>

            {/* CD Photo Tips - only shown when CD is selected */}
            {mediaType === 'cd' && (
              <div className="space-y-4">
                <CDPhotoTips />
                
                {/* Show prefilled matrix if present */}
                {prefilledMatrix && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <Disc className="h-4 w-4 text-green-600" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        <strong>Matrix code ingeladen:</strong> {prefilledMatrix}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrefilledMatrix(null)}
                        className="h-6 px-2 text-xs"
                      >
                        Verwijder
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Show prefilled IFPI codes if present */}
                {prefilledIfpiCodes.length > 0 && (
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        <strong>IFPI codes:</strong> {prefilledIfpiCodes.join(', ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrefilledIfpiCodes([])}
                        className="h-6 px-2 text-xs"
                      >
                        Verwijder
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Directe link naar Matrix Enhancer */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate('/cd-matrix-enhancer')}
                    >
                      <Sparkles className="h-4 w-4" />
                      {prefilledMatrix ? 'Andere Matrix Detecteren' : 'Open Matrix Enhancer (Geavanceerd)'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Handmatige tuning voor moeilijke CD foto's
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Condition Grade Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Conditie Beoordeling <span className="text-red-500">*</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecteer staat (verplicht)</label>
                  <select value={conditionGrade} onChange={e => setConditionGrade(e.target.value)} className={`w-full p-2 border rounded-md ${!conditionGrade ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <option value="" disabled>Selecteer een conditie</option>
                    <option value="Mint (M)">Mint (M) - Perfect, nieuwstaat</option>
                    <option value="Near Mint (NM)">Near Mint (NM) - Bijna perfect</option>
                    <option value="Very Good Plus (VG+)">Very Good Plus (VG+) - Goede staat</option>
                    <option value="Very Good (VG)">Very Good (VG) - Duidelijke gebruikssporen</option>
                    <option value="Good Plus (G+)">Good Plus (G+) - Zichtbare slijtage</option>
                    <option value="Good (G)">Good (G) - Duidelijke slijtage</option>
                    <option value="Fair (F)">Fair (F) - Slechte staat</option>
                  </select>
                  {!conditionGrade && <p className="text-sm text-red-600">Een conditie selectie is verplicht</p>}
                </div>
              </CardContent>
            </Card>

            {/* From Matrix Enhancer: Show compact preview */}
            {fromMatrixEnhancer && uploadedFiles.length > 0 && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    Foto geladen van Matrix Enhancer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <img 
                      src={uploadedFiles[0].preview} 
                      alt="Matrix foto" 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Foto is klaar voor analyse
                      </p>
                      {prefilledMatrix && (
                        <Badge className="mt-2 bg-primary/20 text-primary">
                          Matrix: {prefilledMatrix}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFromMatrixEnhancer(false);
                        setUploadedFiles([]);
                        setPrefilledMatrix(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Upload - only show if NOT from Matrix Enhancer */}
            {!fromMatrixEnhancer && (
              <Card>
                <CardHeader>
                  <CardTitle>Foto's</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Klik om foto's toe te voegen
                    </p>
                    <input type="file" accept="image/*" capture="environment" multiple onChange={handleFileUpload} className="hidden" id="file-upload-v2" />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload-v2" className="cursor-pointer flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Foto's
                      </label>
                    </Button>
                  </div>

                  {/* Uploaded Files Preview with Smart Enhancement Comparison */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">
                          {uploadedFiles.length} foto{uploadedFiles.length !== 1 ? "'s" : ''} geüpload
                        </p>
                        {uploadedFiles.some(f => f.processedPreview) && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Smart verbeterd
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedFiles.map(file => (
                          <ScannerPhotoPreview
                            key={file.id}
                            id={file.id}
                            fileName={file.file.name}
                            originalPreview={file.preview}
                            processedPreview={file.processedPreview}
                            processingStats={file.processingStats}
                            onRemove={removeFile}
                            disabled={isAnalyzing}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Sleep de slider om origineel vs. smart verbeterd te vergelijken
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Analysis Button */}
            <Card>
              <CardContent className="pt-6">
                <Button onClick={startAnalysis} disabled={uploadedFiles.length === 0 || isAnalyzing || !conditionGrade || !mediaType || !user} className="w-full" size="lg">
                  {isAnalyzing ? <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      V2 Analyse bezig...
                    </> : <>
                      <Brain className="mr-2 h-4 w-4" />
                      <Sparkles className="mr-1 h-4 w-4" />
                      Start V2 Analyse
                    </>}
                </Button>

                {!user && <p className="text-sm text-red-600 text-center mt-2">
                    Je moet ingelogd zijn om de analyse te gebruiken
                  </p>}

                {(!conditionGrade || !mediaType) && uploadedFiles.length > 0 && user && <p className="text-sm text-red-600 text-center mt-2">
                    {!mediaType && "Selecteer eerst een media type en "}
                    {!conditionGrade && "selecteer een conditie "}
                    om de analyse te starten
                  </p>}

                {isAnalyzing && <div className="mt-4 space-y-2">
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      {analysisProgress < 30 && "Foto's uploaden..."}
                      {analysisProgress >= 30 && analysisProgress < 50 && "Matrix foto optimalisatie..."}
                      {analysisProgress >= 50 && analysisProgress < 75 && "Multi-pass AI analyse..."}
                      {analysisProgress >= 75 && analysisProgress < 90 && "Discogs zoekstrategie..."}
                      {analysisProgress >= 90 && "Resultaten verwerken..."}
                    </p>
                  </div>}
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Fout bij V2 analyse:</p>
                    <p>{error}</p>
                    <p className="text-sm">
                      Probeer het opnieuw of controleer je internetverbinding. 
                      Als het probleem aanhoudt, controleer de logs in de browser console.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>}
          </>}

        {/* Matrix Verification Step */}
        {analysisResult && verificationStep === 'verifying' && analysisResult.result.matrix_number && (
          <MatrixVerificationStep
            data={{
              matrixNumber: analysisResult.result.matrix_number,
              matrixCharacters: analysisResult.result.matrix_characters || [],
              overallConfidence: analysisResult.result.overall_matrix_confidence || 0.5,
              needsVerification: analysisResult.result.needs_verification || false,
              mediaType: mediaType as 'vinyl' | 'cd',
              photoUrl: uploadedFiles[uploadedFiles.length - 1]?.preview
            }}
            onVerified={handleMatrixVerified}
            onSkip={handleSkipVerification}
          />
        )}

        {/* Analysis Results - only show after verification is complete */}
        {analysisResult && (verificationStep === 'verified' || verificationStep === 'skipped') && <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  V2 Analyse Resultaat
                  <Badge variant="outline">{analysisResult.version}</Badge>
                </CardTitle>
              </div>
              <Button onClick={resetForm} variant="outline">
                Nieuwe Analyse
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">Vertrouwen Score:</span>
                <Badge variant={analysisResult.result.confidence_score > 0.8 ? "default" : analysisResult.result.confidence_score > 0.5 ? "secondary" : "destructive"}>
                  {Math.round(analysisResult.result.confidence_score * 100)}%
                </Badge>
              </div>

              {/* Release Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Release Informatie</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Artiest:</strong> {analysisResult.result.artist || 'Niet gevonden'}</div>
                    <div><strong>Titel:</strong> {analysisResult.result.title || 'Niet gevonden'}</div>
                    <div><strong>Label:</strong> {analysisResult.result.label || 'Niet gevonden'}</div>
                    <div><strong>Catalog Nr:</strong> {analysisResult.result.catalog_number || 'Niet gevonden'}</div>
                    <div><strong>Jaar:</strong> {analysisResult.result.year || 'Niet gevonden'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    Technische Details
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Matrix nummer: gegraveerd in de binnenste ring van de CD. Foto de disc onder een hoek voor beste resultaat.</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span><strong>Matrix Nr:</strong> {analysisResult.result.matrix_number || 'null'}</span>
                      {!analysisResult.result.matrix_number && mediaType === 'cd' && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => navigate('/cd-matrix-enhancer')}
                        >
                          🔍 Matrix Enhancer →
                        </Button>
                      )}
                    </div>
                    <div><strong>IFPI Mastering:</strong> {analysisResult.result.sid_code_mastering || 'null'}</div>
                    <div><strong>IFPI Mould:</strong> {analysisResult.result.sid_code_mould || 'null'}</div>
                    <div><strong>Label Code:</strong> {analysisResult.result.label_code || 'null'}</div>
                    {analysisResult.result.barcode && <div><strong>Barcode:</strong> {analysisResult.result.barcode}</div>}
                    {analysisResult.result.genre && <div><strong>Genre:</strong> {analysisResult.result.genre}</div>}
                    {analysisResult.result.country && <div><strong>Land:</strong> {analysisResult.result.country}</div>}
                    {analysisResult.result.image_quality && <div><strong>Beeld kwaliteit:</strong> {analysisResult.result.image_quality}</div>}
                    <div><strong>Scan ID:</strong> {analysisResult.scanId}</div>
                    {analysisResult.result.discogs_id && <div><strong>Discogs ID:</strong> {analysisResult.result.discogs_id}</div>}
                  </div>
                  
                  {/* Matrix Enhancer link for poor quality scans */}
                  {mediaType === 'cd' && analysisResult.result.image_quality === 'poor' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-2"
                      onClick={() => navigate('/cd-matrix-enhancer')}
                    >
                      <Sparkles className="h-4 w-4" />
                      Probeer Matrix Enhancer voor betere resultaten
                    </Button>
                  )}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Marktprijzen
                </h3>
                
                {(() => {
                  // Use pricing from V2 response first, fallback to searchResults
                  const pricing = analysisResult.result.pricing_stats || searchResults[0]?.pricing_stats;
                  if (isPricingLoading) {
                    return <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Prijzen laden...
                      </div>;
                  }
                  // Check if release is blocked from sale (check both V2 response and searchResults)
                  const isBlocked = (pricing && 'blocked' in pricing && pricing.blocked);
                  const blockedReason = pricing && 'blocked_reason' in pricing ? pricing.blocked_reason : null;
                  if (isBlocked) {
                    return <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Verkoop geblokkeerd</p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {blockedReason || 'Deze release is geblokkeerd voor verkoop op Discogs.'}
                            </p>
                          </div>
                        </div>
                      </div>;
                  }
                  if (pricing && (pricing.lowest_price || pricing.median_price || pricing.highest_price)) {
                    const formatPrice = (val: string | number | null | undefined): string => {
                      if (val == null) return '-';
                      const num = typeof val === 'string' ? parseFloat(val) : val;
                      return isNaN(num) ? '-' : num.toFixed(2);
                    };
                    const numForSale = 'num_for_sale' in pricing ? pricing.num_for_sale : 0;
                    return <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                            <TrendingDown className="h-4 w-4 mx-auto text-green-600 mb-1" />
                            <p className="text-xs text-muted-foreground">Laagste</p>
                            <p className="font-bold text-green-600">
                              €{formatPrice(pricing.lowest_price)}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                            <TrendingUp className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                            <p className="text-xs text-muted-foreground">Mediaan</p>
                            <p className="font-bold text-blue-600">
                              €{formatPrice(pricing.median_price)}
                            </p>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                            <TrendingUp className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                            <p className="text-xs text-muted-foreground">Hoogste</p>
                            <p className="font-bold text-orange-600">
                              €{formatPrice(pricing.highest_price)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {numForSale} te koop
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => analysisResult.result.discogs_id && retryPricing(analysisResult.result.discogs_id)} className="h-7 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Vernieuw
                          </Button>
                        </div>
                      </div>;
                  }
                  if (analysisResult.result.discogs_id) {
                    return <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">Geen prijsdata beschikbaar</p>
                        <Button variant="outline" size="sm" onClick={() => searchByDiscogsId(analysisResult.result.discogs_id!.toString())}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Opnieuw proberen
                        </Button>
                      </div>;
                  }
                  return <p className="text-sm text-muted-foreground text-center py-4">
                      Geen Discogs ID gevonden - prijzen niet beschikbaar
                    </p>;
                })()}
              </div>

              {/* Action Buttons */}
              {analysisResult.result.discogs_url && <div className="pt-4 space-y-3">
                  <Button onClick={() => {
                  if (!conditionGrade) {
                    toast({
                      title: "Conditie vereist",
                      description: "Selecteer eerst een conditie voordat je het item aan je collectie toevoegt.",
                      variant: "destructive"
                    });
                    return;
                  }
                  console.log('🔗 Adding to collection with condition:', conditionGrade);
                  const params = new URLSearchParams({
                    mediaType: mediaType,
                    discogsId: analysisResult.result.discogs_id?.toString() || '',
                    artist: analysisResult.result.artist || '',
                    title: analysisResult.result.title || '',
                    label: analysisResult.result.label || '',
                    catalogNumber: analysisResult.result.catalog_number || '',
                    year: analysisResult.result.year?.toString() || '',
                    condition: conditionGrade,
                    fromAiScan: 'true'
                  });
                  console.log('🚀 Navigating to:', `/scanner/discogs?${params.toString()}`);
                  navigate(`/scanner/discogs?${params.toString()}`);
                }} className="w-full" disabled={!conditionGrade}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Toevoegen aan Collectie
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <a href={analysisResult.result.discogs_url} target="_blank" rel="noopener noreferrer">
                      Bekijk op Discogs
                    </a>
                  </Button>
                </div>}

              {/* AI Description */}
              {analysisResult.result.ai_description && <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">V2 AI Analyse</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {analysisResult.result.ai_description}
                  </p>
                </div>}
            </CardContent>
          </Card>}
        </div>
      </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt isOpen={showUpgradePrompt} onClose={() => setShowUpgradePrompt(false)} reason="usage_limit" currentPlan={subscription?.plan_slug || 'free'} />
    </>;
}