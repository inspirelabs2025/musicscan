import { useState, useEffect } from "react";
import { Camera, Disc3, ScanLine, TrendingUp, Loader2, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import { useVinylAnalysis } from "@/hooks/useVinylAnalysis";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: number]: string}>({});
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
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Analyse Voltooid!</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Artiest:</strong> {analysisResult.ocrResults?.artist || 'Niet gevonden'}</p>
                      <p><strong>Titel:</strong> {analysisResult.ocrResults?.title || 'Niet gevonden'}</p>
                      <p><strong>Jaar:</strong> {analysisResult.ocrResults?.year || 'Niet gevonden'}</p>
                    </div>
                    <div>
                      <p><strong>Catalogusnummer:</strong> {analysisResult.ocrResults?.catalog_number || 'Niet gevonden'}</p>
                      <p><strong>Matrixnummer:</strong> {analysisResult.ocrResults?.matrix_number || 'Niet gevonden'}</p>
                      <p><strong>Label:</strong> {analysisResult.ocrResults?.label || 'Niet gevonden'}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      // TODO: Navigate to Discogs search/price analysis
                      console.log('Starting Discogs search with:', analysisResult.ocrResults);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Zoek op Discogs & Analyseer Prijs
                  </Button>
                </div>
              )}
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
      </main>
    </div>
  );
};

export default Index;
