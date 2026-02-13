import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Brain, CheckCircle, AlertCircle, Clock, Sparkles, ShoppingCart, RefreshCw, Loader2, Camera, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import testCdMatrix from '@/assets/test-cd-matrix.jpg';
import { EnhancedScanPreview } from '@/components/scanner/EnhancedScanPreview';
import { AIScanV2Results } from '@/components/scanner/AIScanV2Results';
import { ScanChatTab } from '@/components/scanner/ScanChatTab';

// Simple V2 components for media type and condition selection

interface UploadedFile {
  file: File;
  preview: string;
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
    // Technical identifiers
    matrix_number?: string | null;
    sid_code_mastering?: string | null;
    sid_code_mould?: string | null;
    label_code?: string | null;
    barcode?: string | null;
    genre?: string | null;
    country?: string | null;
    // Pricing from Discogs
    pricing_stats?: {
      lowest_price: number | null;
      median_price: number | null;
      highest_price: number | null;
      num_for_sale: number;
      currency: string;
      blocked?: boolean;
      blocked_reason?: string;
    } | null;
    // Collector-grade additions
    match_status?: string;
    missing_fields?: string[];
    photo_guidance?: Array<{ field: string; instruction: string }>;
    collector_audit?: Array<{ step: string; detail: string; timestamp: string }>;
    suggestions?: Array<{ id: number; title: string; catno?: string; year?: number; country?: string; url?: string }>;
    search_metadata?: any;
  };
  version: string;
}
export default function AIScanV2() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [conditionGrade, setConditionGrade] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const {
    checkUsageLimit,
    incrementUsage
  } = useUsageTracking();
  const {
    subscription
  } = useSubscriptionContext();

  // Discogs search for automatic pricing
  const {
    searchByDiscogsId,
    searchResults,
    isPricingLoading,
    retryPricing,
    resetSearchState
  } = useDiscogsSearch();

  // Auto-trigger price check ONLY when V2 analysis didn't already return pricing
  useEffect(() => {
    if (analysisResult?.result?.discogs_id) {
      const hasPricing = analysisResult.result.pricing_stats && 
        (analysisResult.result.pricing_stats.lowest_price || analysisResult.result.pricing_stats.median_price);
      if (!hasPricing) {
        console.log('🔍 Auto-triggering price check for Discogs ID (no pricing from V2):', analysisResult.result.discogs_id);
        searchByDiscogsId(analysisResult.result.discogs_id.toString());
      } else {
        console.log('✅ Using pricing from V2 analysis - skipping extra search');
      }
    }
  }, [analysisResult?.result?.discogs_id, searchByDiscogsId]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          const newFile: UploadedFile = {
            file,
            preview: e.target?.result as string,
            id: Math.random().toString(36).substr(2, 9)
          };
          setUploadedFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);
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
      const {
        data,
        error: functionError
      } = await supabase.functions.invoke('ai-photo-analysis-v2', {
        body: {
          photoUrls,
          mediaType,
          conditionGrade
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
    resetSearchState();
  };

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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-20">

      <div className="p-4 pt-4 md:pt-20">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Header - compact on mobile */}
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-3xl font-bold text-primary flex items-center justify-center gap-1.5">
              <Brain className="h-5 w-5 md:h-8 md:w-8" />
              Smart Scan
              <Badge variant="secondary" className="ml-1 text-[10px] md:text-xs">BETA</Badge>
            </h1>
          </div>

          {/* Chat Scanner - directly rendered without tabs */}
          <div className="w-full mt-4">
            <ScanChatTab />
          </div>
        </div>
      </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt isOpen={showUpgradePrompt} onClose={() => setShowUpgradePrompt(false)} reason="usage_limit" currentPlan={subscription?.plan_slug || 'free'} />

    </>;
}