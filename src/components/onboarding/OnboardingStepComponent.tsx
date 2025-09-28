import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, Camera, Sparkles, Library, MessageCircle, 
  Users, Music2, CheckCircle, Scan, Brain, 
  TrendingUp, Share2, Play
} from 'lucide-react';

interface OnboardingStepProps {
  step: {
    id: number;
    title: string;
    description: string;
    component: string;
    icon: string;
  };
  stepIndex: number;
  totalSteps: number;
}

const iconMap = {
  Music,
  Camera,
  Sparkles,
  Library,
  MessageCircle,
  Users,
  Music2,
  CheckCircle
};

export const OnboardingStepComponent: React.FC<OnboardingStepProps> = ({
  step,
  stepIndex,
  totalSteps
}) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || Music;

  const handleNavigateToScanner = () => {
    navigate('/scanner');
  };

  const handleNavigateToCommunity = () => {
    navigate('/community');
  };

  const renderStepContent = () => {
    switch (step.component) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-4">
                <Music className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Welkom bij MusicScan!</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                De meest geavanceerde app voor muziekliefhebbers om hun vinylcollectie en CD's te scannen, 
                beheren en ontdekken. Laten we je wegwijs maken!
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-4 text-center">
                  <Scan className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Smart Scanning</h3>
                  <p className="text-sm text-muted-foreground">AI-powered herkenning</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Intelligente Analyse</h3>
                  <p className="text-sm text-muted-foreground">Automatische prijsschatting</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Share2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Social Features</h3>
                  <p className="text-sm text-muted-foreground">Deel je collectie</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'first-scan':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">Scan je eerste item</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Begin met het maken van een foto van je vinyl of CD. Onze AI herkent automatisch 
                alle details en geeft je een prijsschatting.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
                  <div>
                    <div className="font-medium">Ga naar Scanner</div>
                    <div className="text-sm text-muted-foreground">Klik op "Scanner" in de navigatie</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">2</div>
                  <div>
                    <div className="font-medium">Maak een foto</div>
                    <div className="text-sm text-muted-foreground">Houd je camera stil en focus op de cover</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">3</div>
                  <div>
                    <div className="font-medium">Wacht op AI analyse</div>
                    <div className="text-sm text-muted-foreground">Onze AI doet de rest automatisch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-magic':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">AI Magic in actie</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Onze geavanceerde AI herkent niet alleen je muziek, maar geeft ook waardevolle insights.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Automatische Herkenning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Artiest & Titel</span>
                    <Badge variant="secondary">✓ Herkend</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Label & Jaar</span>
                    <Badge variant="secondary">✓ Herkend</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Catalogusnummer</span>
                    <Badge variant="secondary">✓ Herkend</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Prijsanalyse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Geschatte waarde</span>
                    <span className="font-medium text-green-600">€25-45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conditie analyse</span>
                    <Badge variant="outline">VG+</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Markttrend</span>
                    <span className="text-green-600 text-sm">↗ Stijgend</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'collection':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Library className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">Je Collectie Beheren</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Alle gescande items worden automatisch toegevoegd aan je persoonlijke collectie.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Collectie Features
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Filter op genre, artiest of jaar
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Sorteer op prijs of datum
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Deel items op sociale media
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Export naar verschillende formaten
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Statistieken
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Totale waarde</span>
                      <span className="font-bold">€1,245</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aantal items</span>
                      <span className="font-bold">47</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Favoriete genre</span>
                      <Badge>Rock</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">Chat met je Collectie</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Stel vragen over je muziek aan onze AI. Krijg gepersonaliseerde aanbevelingen en insights.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Jij</p>
                        <p className="text-sm">"Wat is mijn duurste vinyl?"</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1 text-primary">MusicScan AI</p>
                        <p className="text-sm">Je duurste vinyl is "Dark Side of the Moon" van Pink Floyd (€87). Het is een originele pressing uit 1973 in VG+ conditie!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Probeer vragen zoals:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">"Welke albums moet ik verkopen?"</Badge>
                  <Badge variant="outline">"Toon mijn jazz collectie"</Badge>
                  <Badge variant="outline">"Wat is mijn totale waarde?"</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">Join de Community</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Ontmoet andere muziekliefhebbers, deel je vondsten en ontdek nieuwe muziek.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-4 text-center">
                  <Share2 className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Deel je Vondsten</h3>
                  <p className="text-sm text-muted-foreground">
                    Laat andere zien wat je hebt gevonden
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Forum Discussies</h3>
                  <p className="text-sm text-muted-foreground">
                    Bespreek muziek met gelijkgestemden
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Trending Albums</h3>
                  <p className="text-sm text-muted-foreground">
                    Zie wat populair is deze week
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'spotify':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Music2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">Spotify Integratie</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Verbind je Spotify account om je gescande muziek direct af te spelen en playlists te maken.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                    <Play className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">Direct Afspelen</div>
                      <div className="text-xs text-muted-foreground">Luister naar je gescande albums</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                    <Library className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">Playlists Maken</div>
                      <div className="text-xs text-muted-foreground">Automatische playlists van je collectie</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Button variant="outline" className="mb-4">
                  <Music2 className="h-4 w-4 mr-2" />
                  Verbind Spotify (Optioneel)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Je kunt dit ook later doen via je profiel instellingen
                </p>
              </div>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">🎉 Gefeliciteerd!</h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
                Je hebt de MusicScan onboarding succesvol voltooid. 
                Je bent nu klaar om je muziekcollectie volledig te ontdekken en beheren!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <Button
                variant="ghost"
                onClick={handleNavigateToScanner}
                className="h-auto p-0"
              >
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-md cursor-pointer w-full">
                  <CardContent className="p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm">Begin met Scannen</h3>
                    <p className="text-xs text-muted-foreground">Ga naar de Scanner en maak je eerste foto</p>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                onClick={handleNavigateToCommunity}
                className="h-auto p-0"
              >
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-md cursor-pointer w-full">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm">Ontdek de Community</h3>
                    <p className="text-xs text-muted-foreground">Zie wat anderen aan het verzamelen zijn</p>
                  </CardContent>
                </Card>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Heb je vragen? Bezoek het Help gedeelte of start een chat met onze AI assistant.</p>
            </div>
          </div>
        );

      default:
        return <div>Stap niet gevonden</div>;
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      {renderStepContent()}
    </div>
  );
};