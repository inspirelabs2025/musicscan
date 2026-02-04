import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Disc, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  MatrixUploadStep,
  MatrixProcessingStep,
  MatrixReviewStep,
  MatrixOCRResult,
  MatrixDebugAccordion,
  DEFAULT_PROCESSING_STEPS,
} from '@/components/matrix-enhancer';
import type { OCRResult } from '@/components/matrix-enhancer';
import {
  processMatrixImage,
  MatrixEnhancementParams,
  MatrixProcessingResult,
  DEFAULT_PARAMS,
} from '@/utils/matrixEnhancementPipeline';

type Step = 'upload' | 'processing' | 'review' | 'ocr';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export default function CDMatrixEnhancer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  
  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Processing state
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(DEFAULT_PROCESSING_STEPS);
  const [progress, setProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Result state
  const [enhancementResult, setEnhancementResult] = useState<MatrixProcessingResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isRunningOCR, setIsRunningOCR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Timing state
  const [timings, setTimings] = useState<{ enhancement?: number; ocr?: number; total?: number }>({});

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Start processing
    setCurrentStep('processing');
    setProcessingError(null);
    setIsProcessing(true);
    
    // Simulate step progress
    const updateStep = (stepId: string, status: ProcessingStep['status']) => {
      setProcessingSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status } : s
      ));
    };
    
    const stepOrder = ['load', 'grayscale', 'highlight', 'clahe', 'denoise', 'sharpen', 'gradient', 'threshold'];
    
    try {
      // Process with progress simulation
      for (let i = 0; i < stepOrder.length; i++) {
        updateStep(stepOrder[i], 'processing');
        setProgress((i / stepOrder.length) * 100);
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 100));
        
        updateStep(stepOrder[i], 'complete');
      }
      
      // Actual processing
      const result = await processMatrixImage(file, DEFAULT_PARAMS);
      
      setProgress(100);
      setEnhancementResult(result);
      setTimings(prev => ({ ...prev, enhancement: result.processingTimeMs }));
      
      // Move to review step
      setTimeout(() => {
        setCurrentStep('review');
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Verwerking mislukt');
      updateStep(stepOrder[stepOrder.length - 1], 'error');
      setIsProcessing(false);
    }
  }, []);

  // Handle reprocessing with new params
  const handleReprocess = useCallback(async (params: MatrixEnhancementParams) => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      const result = await processMatrixImage(selectedFile, params);
      setEnhancementResult(result);
      setTimings(prev => ({ ...prev, enhancement: result.processingTimeMs }));
      
      toast({
        title: 'Verwerking voltooid',
        description: `Afbeelding opnieuw verwerkt in ${result.processingTimeMs.toFixed(0)}ms`,
      });
    } catch (error) {
      console.error('Reprocess error:', error);
      toast({
        title: 'Fout',
        description: 'Kon afbeelding niet opnieuw verwerken',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, toast]);

  // Run OCR
  const handleRunOCR = useCallback(async () => {
    if (!enhancementResult) return;
    
    setIsRunningOCR(true);
    const startTime = performance.now();
    
    try {
      // Call the OCR edge function with zoomed ring for better matrix detection
      const { data, error } = await supabase.functions.invoke('matrix-ocr', {
        body: {
          enhancedImage: enhancementResult.enhancedPreview,
          ocrLayer: enhancementResult.ocrLayer,
          ocrLayerInverted: enhancementResult.ocrLayerInverted,
          zoomedRing: enhancementResult.zoomedRing,
          zoomedRingEnhanced: enhancementResult.zoomedRingEnhanced,
        }
      });
      
      if (error) throw error;
      
      const ocrTime = performance.now() - startTime;
      
      const result: OCRResult = {
        rawText: data.raw_text || '',
        cleanText: data.clean_text || '',
        segments: (data.segments || []).map((s: any) => ({
          text: s.text,
          type: s.type as OCRResult['segments'][0]['type'],
          confidence: s.confidence,
        })),
        overallConfidence: data.overall_confidence || 0,
        layerUsed: data.layer_used || 'normal',
        processingTimeMs: ocrTime,
      };
      
      setOcrResult(result);
      setTimings(prev => ({ 
        ...prev, 
        ocr: ocrTime,
        total: (prev.enhancement || 0) + ocrTime
      }));
      setCurrentStep('ocr');
      
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'OCR Fout',
        description: error instanceof Error ? error.message : 'Kon matrix codes niet lezen',
        variant: 'destructive',
      });
    } finally {
      setIsRunningOCR(false);
    }
  }, [enhancementResult, toast]);

  // Save result
  const handleSave = useCallback(async () => {
    if (!user || !enhancementResult || !ocrResult || !originalImage) {
      toast({
        title: 'Fout',
        description: 'Geen resultaat om op te slaan',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Upload images to storage
      const timestamp = Date.now();
      const basePath = `matrix-scans/${user.id}/${timestamp}`;
      
      // Convert base64 to blob and upload
      const uploadImage = async (dataUrl: string, name: string) => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const path = `${basePath}/${name}`;
        
        const { error } = await supabase.storage
          .from('vinyl_images')
          .upload(path, blob, { contentType: blob.type });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('vinyl_images')
          .getPublicUrl(path);
        
        return publicUrl;
      };
      
      const [originalUrl, enhancedUrl, ocrLayerUrl] = await Promise.all([
        uploadImage(originalImage, 'original.jpg'),
        uploadImage(enhancementResult.enhancedPreview, 'enhanced.jpg'),
        uploadImage(enhancementResult.ocrLayer, 'ocr-layer.png'),
      ]);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('matrix_scans')
        .insert({
          user_id: user.id,
          original_image_url: originalUrl,
          enhanced_image_url: enhancedUrl,
          ocr_layer_url: ocrLayerUrl,
          ocr_text_raw: ocrResult.rawText,
          ocr_text_clean: ocrResult.cleanText,
          ocr_confidence: ocrResult.overallConfidence,
          ocr_layer_used: ocrResult.layerUsed,
          params_json: enhancementResult.params,
          roi_json: enhancementResult.roi,
          processing_time_ms: Math.round(timings.total || 0),
          status: 'completed',
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: 'Opgeslagen!',
        description: 'Matrix scan resultaat is opgeslagen',
      });
      
      // Reset to start
      handleReset();
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Opslaan mislukt',
        description: error instanceof Error ? error.message : 'Kon resultaat niet opslaan',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, enhancementResult, ocrResult, originalImage, timings, toast]);

  // Reset to start
  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setOriginalImage(null);
    setSelectedFile(null);
    setProcessingSteps(DEFAULT_PROCESSING_STEPS);
    setProgress(0);
    setProcessingError(null);
    setEnhancementResult(null);
    setOcrResult(null);
    setTimings({});
  }, []);

  return (
    <>
      <Helmet>
        <title>CD Matrix Enhancer | MusicScan</title>
        <meta name="description" content="Verbeter CD matrix foto's en lees automatisch de matrix codes met geavanceerde beeldverwerking en OCR." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-6 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/scanner">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Disc className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">CD Matrix Enhancer</h1>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['upload', 'processing', 'review', 'ocr'] as Step[]).map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === step
                      ? 'bg-primary text-primary-foreground'
                      : index < ['upload', 'processing', 'review', 'ocr'].indexOf(currentStep)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      index < ['upload', 'processing', 'review', 'ocr'].indexOf(currentStep)
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          {currentStep === 'upload' && (
            <MatrixUploadStep onFileSelect={handleFileSelect} />
          )}

          {currentStep === 'processing' && originalImage && (
            <MatrixProcessingStep
              originalImage={originalImage}
              progress={progress}
              steps={processingSteps}
              error={processingError}
            />
          )}

          {currentStep === 'review' && originalImage && enhancementResult && (
            <>
              <MatrixReviewStep
                originalImage={originalImage}
                result={enhancementResult}
                onReprocess={handleReprocess}
                onRunOCR={handleRunOCR}
                isProcessing={isProcessing || isRunningOCR}
              />
              <MatrixDebugAccordion
                params={enhancementResult.params}
                roi={enhancementResult.roi}
                quality={enhancementResult.quality}
                timings={timings}
              />
            </>
          )}

          {currentStep === 'ocr' && enhancementResult && ocrResult && (
            <>
              <MatrixOCRResult
                result={ocrResult}
                enhancedImage={enhancementResult.enhancedPreview}
                ocrLayerImage={enhancementResult.ocrLayer}
                onRetry={handleRunOCR}
                onSave={handleSave}
                onBack={() => setCurrentStep('review')}
                isProcessing={isRunningOCR}
                isSaving={isSaving}
              />
              
              {/* Use in Scanner button */}
              {ocrResult.cleanText && originalImage && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      const matrixCode = ocrResult.cleanText;
                      // Store photo data in sessionStorage for V2 scanner
                      sessionStorage.setItem('matrixEnhancerData', JSON.stringify({
                        matrix: matrixCode,
                        photo: originalImage,
                        timestamp: Date.now(),
                      }));
                      navigate(`/ai-scan-v2?fromEnhancer=true&mediaType=cd`);
                      toast({
                        title: 'Doorgaan naar scanner',
                        description: 'Foto en matrix code overgenomen - selecteer conditie om te starten',
                      });
                    }}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Doorgaan met Scannen
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Foto + matrix code worden meegenomen - alleen conditie kiezen
                  </p>
                </div>
              )}
              
              <MatrixDebugAccordion
                params={enhancementResult.params}
                roi={enhancementResult.roi}
                quality={enhancementResult.quality}
                ocrResult={ocrResult}
                timings={timings}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
