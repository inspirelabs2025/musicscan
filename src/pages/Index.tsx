import { useState } from "react";
import { Camera, Disc3, ScanLine, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);

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
            const isCompleted = currentStep > index;
            
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

        {/* Upload Area */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Stap {currentStep + 1}: {steps[currentStep].title}</span>
            </CardTitle>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">
                    Sleep een foto hierheen of klik om te uploaden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ondersteunde formaten: JPG, PNG, HEIC (max 10MB)
                  </p>
                </div>
                <Button size="lg" className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Kies Foto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Voortgang</span>
            <span>{currentStep + 1} / {steps.length}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-gradient-vinyl h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
