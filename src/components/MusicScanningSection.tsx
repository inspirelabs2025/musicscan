import { Camera, Brain, TrendingUp, Disc, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const MusicScanningSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;

  const steps = [
    { number: "1", title: sc.takePhotos, description: sc.takePhotosDesc, icon: Camera, color: "bg-blue-500" },
    { number: "2", title: sc.smartAnalysis, description: sc.smartAnalysisDesc, icon: Brain, color: "bg-purple-500" },
    { number: "3", title: sc.priceCheck, description: sc.priceCheckDesc, icon: TrendingUp, color: "bg-green-500" },
  ];

  const handleVinylClick = () => navigate(user ? '/scanner?type=vinyl' : '/auth');
  const handleCDClick = () => navigate(user ? '/scanner?type=cd' : '/auth');

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-background via-background/50 to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{sc.scanningMusic}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">{sc.discoverValue}</p>
        </div>

        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">{sc.howItWorks}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-4">{step.number}. {step.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="w-6 h-6 text-primary" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{sc.startAdventure}</h3>
            <Music className="w-6 h-6 text-accent" />
          </div>
          <p className="text-lg text-muted-foreground mb-8">{sc.adventureSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-background to-muted/30" onClick={handleVinylClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Disc className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{sc.vinylTreasureHunt}</h4>
              <p className="text-muted-foreground mb-6">{sc.vinylTreasureDesc}</p>
              <Button className="w-full group-hover:scale-105 transition-transform duration-200" size="lg">{sc.startVinylScan}</Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50 bg-gradient-to-br from-background to-muted/30" onClick={handleCDClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{sc.cdTreasureHunt}</h4>
              <p className="text-muted-foreground mb-6">{sc.cdTreasureDesc}</p>
              <Button variant="outline" className="w-full group-hover:scale-105 transition-transform duration-200 border-2" size="lg">{sc.startCDScan}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
