import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Brain, Disc, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface AnalysisResult {
  scanId: string;
  result?: {
    discogs_id: number | null;
    discogs_url: string | null;
    artist: string | null;
    title: string | null;
    label: string | null;
    catalog_number: string | null;
    year: number | null;
    confidence_score: number;
    ai_description: string;
  };
  error?: string;
  success: boolean;
}

// Memoized condition options to prevent re-renders
const conditionOptions = [
  { value: 'Mint (M)', label: 'Mint (M)' },
  { value: 'Near Mint (NM)', label: 'Near Mint (NM)' },
  { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)' },
  { value: 'Very Good (VG)', label: 'Very Good (VG)' },
  { value: 'Good Plus (G+)', label: 'Good Plus (G+)' },
  { value: 'Good (G)', label: 'Good (G)' },
  { value: 'Fair (F)', label: 'Fair (F)' },
  { value: 'Poor (P)', label: 'Poor (P)' }
] as const;

export default function AIScan() {
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd'>('vinyl');
  const [condition, setCondition] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Simplified file management without heavy hook
  const addFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    const newFile: UploadedFile = {
      file,
      preview,
      id: Date.now().toString() + Math.random().toString()
    };
    setUploadedFiles(prev => [...prev, newFile]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
  }, [uploadedFiles]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          addFile(file);
        }
      });
    }
  }, [addFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          addFile(file);
        }
      });
    }
  }, [addFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const startAnalysis = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Geen foto's",
        description: "Upload eerst een of meer foto's om te analyseren",
        variant: "destructive"
      });
      return;
    }

    if (!condition) {
      toast({
        title: "Conditie niet geselecteerd", 
        description: "Selecteer eerst de conditie van het item",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setUploading(true);

    try {
      // Upload files with better error handling
      const uploadPromises = uploadedFiles.map(async (uploadedFile, index) => {
        const fileExt = uploadedFile.file.name.split('.').pop();
        const fileName = `ai-scan-${Date.now()}-${index}.${fileExt}`;
        const filePath = `ai-scans/${fileName}`;

        const { data, error } = await supabase.storage
          .from('vinyl_images')
          .upload(filePath, uploadedFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('vinyl_images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const photoUrls = await Promise.all(uploadPromises);
      setUploading(false);

      console.log('🤖 Starting AI analysis with photos:', photoUrls);

      // Call AI analysis function
      const { data, error } = await supabase.functions.invoke('ai-photo-analysis', {
        body: {
          photoUrls,
          mediaType,
          conditionGrade: condition
        }
      });

      if (error) throw error;

      setAnalysisResult(data);

      if (data.success) {
        toast({
          title: "AI Analyse Voltooid",
          description: `Release gevonden met ${Math.round((data.result?.confidence_score || 0) * 100)}% zekerheid`,
          variant: "default"
        });
      } else {
        toast({
          title: "Analyse Mislukt",
          description: data.error || "Er is een fout opgetreden tijdens de analyse",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
      toast({
        title: "Analyse Fout",
        description: error.message || "Er is een onverwachte fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setUploading(false);
    }
  }, [uploadedFiles, condition, mediaType]);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    clearFiles();
    setCondition('');
  }, [clearFiles]);

  // Memoized confidence calculations
  const getConfidenceColor = useMemo(() => (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  }, []);

  const getConfidenceLabel = useMemo(() => (confidence: number) => {
    if (confidence >= 0.8) return 'Hoge zekerheid';
    if (confidence >= 0.6) return 'Gemiddelde zekerheid';
    return 'Lage zekerheid';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Navigation />
        </div>
      </header>

      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <Brain className="h-8 w-8" />
              AI Foto Analyse
            </h1>
            <p className="text-muted-foreground">
              Ontdek supersnel de juiste release ID met onze AI foto analyse
            </p>
          </div>

        {!analysisResult && (
          <>
            {/* Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle>1. Selecteer Type & Conditie</CardTitle>
                <CardDescription>
                  Kies het mediatype en de conditie van je item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="space-y-2">
                  <Label>Conditie</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer conditie" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>2. Upload Foto's</CardTitle>
                <CardDescription>
                  Sleep foto's hierheen of klik om te selecteren. Je kunt meerdere foto's van verschillende hoeken uploaden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      {uploading ? (
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      ) : (
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium">
                        Sleep foto's hierheen of klik om te selecteren
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ondersteunt JPG, PNG, WebP bestanden
                      </p>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Geüploade Foto's ({uploadedFiles.length})</h3>
                      <Button variant="outline" size="sm" onClick={clearFiles}>
                        Alle Verwijderen
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedFiles.map((uploadedFile) => (
                        <div key={uploadedFile.id} className="relative group">
                          <img
                            src={uploadedFile.preview}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(uploadedFile.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Start Analysis Button */}
            <div className="text-center">
              <Button
                onClick={startAnalysis}
                disabled={isAnalyzing || uploadedFiles.length === 0 || !condition}
                size="lg"
                className="px-8"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI Analyseert...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Start AI Analyse
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {analysisResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                AI Analyse Resultaat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisResult.success && analysisResult.result ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${getConfidenceColor(analysisResult.result.confidence_score)} text-white`}
                    >
                      {getConfidenceLabel(analysisResult.result.confidence_score)} - {Math.round(analysisResult.result.confidence_score * 100)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Artiest</Label>
                      <p className="text-lg">{analysisResult.result.artist || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Titel</Label>
                      <p className="text-lg">{analysisResult.result.title || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Label</Label>
                      <p>{analysisResult.result.label || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Catalogusnummer</Label>
                      <p>{analysisResult.result.catalog_number || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Jaar</Label>
                      <p>{analysisResult.result.year || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Discogs ID</Label>
                      <p>{analysisResult.result.discogs_id || 'Niet gevonden'}</p>
                    </div>
                  </div>

                  {analysisResult.result.discogs_url && (
                    <div>
                      <Button variant="outline" asChild>
                        <a 
                          href={analysisResult.result.discogs_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Bekijk op Discogs
                        </a>
                      </Button>
                    </div>
                  )}

                  {analysisResult.result.ai_description && (
                    <div>
                      <Label className="text-sm font-medium">AI Beschrijving</Label>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">
                        {analysisResult.result.ai_description}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {analysisResult.error || 'Er is een fout opgetreden tijdens de analyse'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={resetAnalysis} variant="outline">
                  Nieuwe Analyse
                </Button>
                {analysisResult.scanId && (
                  <Button variant="secondary" size="sm">
                    Scan ID: {analysisResult.scanId.slice(0, 8)}...
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}