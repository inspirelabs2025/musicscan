import { Camera, Brain, TrendingUp, Disc, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const MusicScanningSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const steps = [
    {
      number: "1",
      title: "Foto's maken",
      description: "Upload duidelijke foto's van je vinyl of CD. Voor vinyl: voorkant, achterkant en matrix. Voor CD's: voorkant, achterkant, barcode en matrix.",
      icon: Camera,
      color: "bg-blue-500",
    },
    {
      number: "2", 
      title: "Smart Analyse",
      description: "Ons systeem analyseert je foto's en herkent automatisch artiest, titel, label, catalogusnummer en andere belangrijke details.",
      icon: Brain,
      color: "bg-purple-500",
    },
    {
      number: "3",
      title: "Prijscheck", 
      description: "Krijg direct de actuele waarde, inclusief adviesprijs op basis van conditie en marktwaarde.",
      icon: TrendingUp,
      color: "bg-green-500",
    },
  ];

  const handleVinylClick = () => {
    if (user) {
      navigate('/scanner?type=vinyl');
    } else {
      navigate('/auth');
    }
  };

  const handleCDClick = () => {
    if (user) {
      navigate('/scanner?type=cd');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Scannen van je Muziek
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Ontdek de waarde van je muziekcollectie met onze geavanceerde technologie
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            Zo werkt het in 3 eenvoudige stappen
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-4">
                  {step.number}. {step.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Start your music adventure */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="w-6 h-6 text-primary" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Start je Muziekavontuur
            </h3>
            <Music className="w-6 h-6 text-accent" />
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            📸 Maak foto's, ontdek schatten - laat de magie beginnen! ✨
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-background to-muted/30"
            onClick={handleVinylClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Disc className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                🎵 Vinyl Treasure Hunt
              </h4>
              <p className="text-muted-foreground mb-6">
                Scan je vinyl collectie en ontdek verborgen schatten in je platenkast
              </p>
              <Button 
                className="w-full group-hover:scale-105 transition-transform duration-200"
                size="lg"
              >
                Start Vinyl Scan
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50 bg-gradient-to-br from-background to-muted/30"
            onClick={handleCDClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">
                💿 CD Schatten Zoeken
              </h4>
              <p className="text-muted-foreground mb-6">
                Ontdek de waarde van je CD collectie en vind zeldzame uitgaven
              </p>
              <Button 
                variant="outline" 
                className="w-full group-hover:scale-105 transition-transform duration-200 border-2"
                size="lg"
              >
                Start CD Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};