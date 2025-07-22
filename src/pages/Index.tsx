import { useState, useEffect } from "react";
import { Camera, Disc3, ScanLine, TrendingUp, Loader2, CheckCircle, Eye, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import { DiscogsTest } from "@/components/DiscogsTest";
import { DiscogsTokenTest } from "@/components/DiscogsTokenTest";
import { ManualPriceInput } from "@/components/ManualPriceInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVinylAnalysis } from "@/hooks/useVinylAnalysis";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: number]: string}>({});
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [useManualPrice, setUseManualPrice] = useState(false);
  const { isAnalyzing, analysisResult, analyzeImages } = useVinylAnalysis();

  // Check if all 3 photos are uploaded to trigger analysis
  useEffect(() => {
    const allPhotosUploaded = Object.keys(uploadedFiles).length === 3;
    
    if (allPhotosUploaded && !isAnalyzing && !analysisResult) {
      console.log('🚀 All 3 photos uploaded, starting OCR analysis...');
      const imageUrls = [uploadedFiles[0], uploadedFiles[1], uploadedFiles[2]];
      analyzeImages(imageUrls);
    }
  }, [uploadedFiles, isAnalyzing, analysisResult, analyzeImages]);

  // Get pricing data from analysis results
  const automaticPrice = analysisResult?.pricingData?.median_price 
    ? parseFloat(analysisResult.pricingData.median_price) 
    : null;

  const lowestPrice = analysisResult?.pricingData?.lowest_price || null;
  const medianPrice = analysisResult?.pricingData?.median_price || null;
  const highestPrice = analysisResult?.pricingData?.highest_price || null;

  // Determine which price to display
  const activePrice = useManualPrice ? manualPrice : automaticPrice;

  const steps = [
    {
      title: "Catalogusnummer",
      description: "Scan het catalogusnummer voor Discogs herkenning",
      icon: ScanLine,
      color: "bg-vinyl-purple"
    },
    {
      title: "Matrixnummer", 
      description: "Fotografeer het matrixnummer van de LP",
      icon: Disc3,
      color: "bg-vinyl-gold"
    },
    {
      title: "Overige informatie",
      description: "Aanvullende foto's en details",
      icon: Camera,
      color: "bg-vinyl-silver"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-scan">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-vinyl flex items-center justify-center">
                <Disc3 className="w-6 h-6 text-white animate-vinyl-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-vinyl bg-clip-text text-transparent">
                  Vinyl Scanner
                </h1>
                <p className="text-sm text-muted-foreground">LP & CD Waardering App</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              v2.0
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            Scan, Identificeer & Waardeer
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload 3 foto's van je LP of CD en krijg direct de Discogs informatie 
            met accurate prijsinschattingen gebaseerd op de actuele marktwaarde.
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/vinyl-scan-complete">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              🎵 Complete Vinyl Scan (Nieuw!)
            </Button>
          </Link>
          <Link to="/marketplace-overview">
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <Store className="h-4 w-4 mr-2" />
              🛒 Marketplace Overview
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="scan">Vinyl Scanner</TabsTrigger>
            <TabsTrigger value="test">Discogs Test</TabsTrigger>
            <TabsTrigger value="token">Token Test</TabsTrigger>
            <TabsTrigger value="catalog" asChild>
              <a href="/catalog-test">Catalog Test</a>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-8">
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Foto Scan</p>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <ScanLine className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Discogs ID</p>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Waardering</p>
              </div>
            </div>

            {/* Steps Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = uploadedFiles[index] !== undefined;
                
                return (
                  <Card 
                    key={index} 
                    className={`transition-all duration-300 cursor-pointer hover:shadow-lg ${
                      isActive ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                    } ${isCompleted ? 'bg-muted/50' : ''}`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mx-auto mb-4 ${
                        isActive ? 'animate-scan-pulse' : ''
                      }`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">
                        Stap {index + 1}: {step.title}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className={`w-full ${isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        variant={isActive ? "default" : "outline"}
                      >
                        {isCompleted ? '✓ Voltooid' : isActive ? 'Upload Foto' : 'Start Stap'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Analysis Status */}
            {(isAnalyzing || analysisResult) && (
              <Card className="max-w-2xl mx-auto mb-8">
                <CardContent className="p-6">
                  {isAnalyzing ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">OCR Analyse Bezig...</h3>
                        <p className="text-sm text-muted-foreground">
                          AI analyseert je foto's voor catalogusnummer, matrixnummer en albuminfo
                        </p>
                      </div>
                    </div>
                  ) : analysisResult && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircle className="w-6 h-6" />
                        <h3 className="text-lg font-semibold">Analyse Voltooid!</h3>
                      </div>
                      
                      {/* OCR Results */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-primary">📀 Album Informatie</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Artiest:</strong> {analysisResult.ocrResults?.artist || 'Niet gevonden'}</p>
                            <p><strong>Titel:</strong> {analysisResult.ocrResults?.title || 'Niet gevonden'}</p>
                            <p><strong>Jaar:</strong> {analysisResult.ocrResults?.year || 'Niet gevonden'}</p>
                            <p><strong>Genre:</strong> {analysisResult.ocrResults?.genre || 'Niet gevonden'}</p>
                          </div>
                          <div>
                            <p><strong>Catalogusnummer:</strong> {analysisResult.ocrResults?.catalog_number || 'Niet gevonden'}</p>
                            <p><strong>Matrixnummer:</strong> {analysisResult.ocrResults?.matrix_number || 'Niet gevonden'}</p>
                            <p><strong>Label:</strong> {analysisResult.ocrResults?.label || 'Niet gevonden'}</p>
                            <p><strong>Land:</strong> {analysisResult.ocrResults?.country || 'Niet gevonden'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Discogs & Pricing Results */}
                      {analysisResult.discogsData?.discogs_id && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                            🎵 Discogs Match Gevonden!
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Discogs ID:</strong> {analysisResult.discogsData.discogs_id}</p>
                            <p>
                              <strong>Discogs URL:</strong> 
                              <a 
                                href={analysisResult.discogsData.discogs_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline ml-2"
                              >
                                Bekijk op Discogs →
                              </a>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Pricing Information */}
                      {(lowestPrice || medianPrice || highestPrice) ? (
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            💰 Discogs Prijsinformatie
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Lowest Price */}
                            {lowestPrice && (
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800 text-center">
                                <p className="text-sm text-green-700 dark:text-green-400">Laagste Prijs</p>
                                <p className="text-xl font-bold text-green-800 dark:text-green-300">
                                  €{lowestPrice}
                                </p>
                              </div>
                            )}
                            
                            {/* Median Price */}
                            {medianPrice && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 text-center">
                                <p className="text-sm text-blue-700 dark:text-blue-400">Gemiddelde</p>
                                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                                  €{medianPrice}
                                </p>
                              </div>
                            )}
                            
                            {/* Highest Price */}
                            {highestPrice && (
                              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800 text-center">
                                <p className="text-sm text-red-700 dark:text-red-400">Hoogste Prijs</p>
                                <p className="text-xl font-bold text-red-800 dark:text-red-300">
                                  €{highestPrice}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                          <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                            ⚠️ Geen Prijsdata Beschikbaar
                          </h4>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">
                            Er kon geen prijsinformatie worden gevonden voor dit album op Discogs.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Manual Price Input - NEW SECTION */}
            {analysisResult && automaticPrice && (
              <div className="mb-8">
                <ManualPriceInput
                  automaticPrice={automaticPrice}
                  manualPrice={manualPrice}
                  useManualPrice={useManualPrice}
                  onManualPriceChange={setManualPrice}
                  onToggleManualPrice={setUseManualPrice}
                />
              </div>
            )}

            {/* Final Price Summary - NEW SECTION */}
            {activePrice && (
              <Card className="max-w-2xl mx-auto mb-8 border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-semibold">Definitieve Prijs</h3>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      €{activePrice.toFixed(2)}
                    </div>
                    <Badge variant={useManualPrice ? "default" : "secondary"}>
                      {useManualPrice ? "Handmatig Aangepast" : "Automatisch Berekend"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Deze prijs kan worden gebruikt voor verkoop of verzekering
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Area - only show if analysis not started */}
            {!isAnalyzing && !analysisResult && (
              <FileUpload
                step={currentStep + 1}
                stepTitle={steps[currentStep].title}
                stepDescription={steps[currentStep].description}
                isCompleted={uploadedFiles[currentStep] !== undefined}
                onFileUploaded={(url) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    [currentStep]: url
                  }));
                  
                  // Auto-advance to next step if not the last step
                  if (currentStep < steps.length - 1) {
                    setTimeout(() => {
                      setCurrentStep(currentStep + 1);
                    }, 1500);
                  }
                }}
              />
            )}

            {/* Progress Indicator */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Voortgang</span>
                <span>{Object.keys(uploadedFiles).length} / {steps.length} voltooid</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-vinyl h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(Object.keys(uploadedFiles).length / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="mt-8">
            <DiscogsTest />
          </TabsContent>
          
          <TabsContent value="token" className="mt-8">
            <DiscogsTokenTest />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
