import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, Camera, Sparkles, Library, MessageCircle, 
  Users, Music2, CheckCircle, Scan, Brain, 
  TrendingUp, Share2, Play
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OnboardingStepProps {
  step: { id: number; title: string; description: string; component: string; icon: string; };
  stepIndex: number;
  totalSteps: number;
}

const iconMap = { Music, Camera, Sparkles, Library, MessageCircle, Users, Music2, CheckCircle };

export const OnboardingStepComponent: React.FC<OnboardingStepProps> = ({ step, stepIndex, totalSteps }) => {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || Music;

  const renderStepContent = () => {
    switch (step.component) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-4">
                <Music className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-3">{sc.welcomeTitle}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{sc.welcomeDesc}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card><CardContent className="p-4 text-center"><Scan className="h-8 w-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold">{sc.smartScanning}</h3><p className="text-sm text-muted-foreground">{sc.smartRecognition}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Brain className="h-8 w-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold">{sc.intelligentAnalysis}</h3><p className="text-sm text-muted-foreground">{sc.autoPriceEstimate}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Share2 className="h-8 w-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold">{sc.socialFeatures}</h3><p className="text-sm text-muted-foreground">{sc.shareCollection}</p></CardContent></Card>
            </div>
          </div>
        );

      case 'first-scan':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">{sc.firstScanTitle}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.firstScanDesc}</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="space-y-4">
                {[
                  { num: "1", title: sc.goToScanner, desc: sc.goToScannerDesc },
                  { num: "2", title: sc.takePhotoStep, desc: sc.takePhotoStepDesc },
                  { num: "3", title: sc.waitForAnalysis, desc: sc.waitForAnalysisDesc },
                ].map(s => (
                  <div key={s.num} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">{s.num}</div>
                    <div><div className="font-medium">{s.title}</div><div className="text-sm text-muted-foreground">{s.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ai-magic':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">{sc.smartRecognitionTitle}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.smartRecognitionDesc}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />{sc.autoRecognition}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm">{sc.artistAndTitle}</span><Badge variant="secondary">{sc.recognised}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm">{sc.labelAndYear}</span><Badge variant="secondary">{sc.recognised}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm">{sc.catalogueNumber}</span><Badge variant="secondary">{sc.recognised}</Badge></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />{sc.priceAnalysisTitle}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm">{sc.estimatedValue}</span><span className="font-medium text-green-600">€25-45</span></div>
                  <div className="flex justify-between"><span className="text-sm">{sc.conditionAnalysis}</span><Badge variant="outline">VG+</Badge></div>
                  <div className="flex justify-between"><span className="text-sm">{sc.marketTrend}</span><span className="text-green-600 text-sm">{sc.rising}</span></div>
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
              <h2 className="text-2xl font-bold mb-3">{sc.manageCollection}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.manageCollectionDesc}</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Library className="h-4 w-4" />{sc.collectionFeatures}</h3>
                  <ul className="space-y-2 text-sm">
                    {[sc.filterByGenre, sc.sortByPrice, sc.shareOnSocial, sc.exportToFormats].map(t => (
                      <li key={t} className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full"></div>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />{sc.statistics}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-sm">{sc.totalValue}</span><span className="font-bold">€1,245</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm">{sc.numberOfItems}</span><span className="font-bold">47</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm">{sc.favouriteGenre}</span><Badge>Rock</Badge></div>
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
              <h2 className="text-2xl font-bold mb-3">{sc.chatWithCollection}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.chatWithCollectionDesc}</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><MessageCircle className="h-4 w-4 text-primary" /></div>
                      <div className="flex-1"><p className="text-sm font-medium mb-1">{sc.you}</p><p className="text-sm">{sc.whatIsMostExpensive}</p></div>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
                      <div className="flex-1"><p className="text-sm font-medium mb-1 text-primary">MusicScan</p><p className="text-sm">{sc.mostExpensiveAnswer}</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">{sc.tryQuestions}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">{sc.whichToSell}</Badge>
                  <Badge variant="outline">{sc.showJazz}</Badge>
                  <Badge variant="outline">{sc.whatIsTotalValue}</Badge>
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
              <h2 className="text-2xl font-bold mb-3">{sc.joinCommunity}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.joinCommunityDesc}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card><CardContent className="p-4 text-center"><Share2 className="h-8 w-8 mx-auto mb-3 text-primary" /><h3 className="font-semibold mb-2">{sc.shareFinds}</h3><p className="text-sm text-muted-foreground">{sc.shareFindsDesc}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" /><h3 className="font-semibold mb-2">{sc.forumDiscussions}</h3><p className="text-sm text-muted-foreground">{sc.forumDiscussionsDesc}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" /><h3 className="font-semibold mb-2">{sc.trendingAlbums}</h3><p className="text-sm text-muted-foreground">{sc.trendingAlbumsDesc}</p></CardContent></Card>
            </div>
          </div>
        );

      case 'spotify':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Music2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">{sc.spotifyIntegration}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">{sc.spotifyIntegrationDesc}</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                    <Play className="h-6 w-6 text-green-600" />
                    <div><div className="font-medium text-sm">{sc.directPlayback}</div><div className="text-xs text-muted-foreground">{sc.directPlaybackDesc}</div></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                    <Library className="h-6 w-6 text-green-600" />
                    <div><div className="font-medium text-sm">{sc.createPlaylists}</div><div className="text-xs text-muted-foreground">{sc.createPlaylistsDesc}</div></div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Button variant="outline" className="mb-4"><Music2 className="h-4 w-4 mr-2" />{sc.connectSpotify}</Button>
                <p className="text-xs text-muted-foreground">{sc.doLater}</p>
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
              <h2 className="text-3xl font-bold mb-4">{sc.congratulations}</h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">{sc.congratulationsDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-xs md:max-w-2xl mx-auto mb-8 px-4 md:px-0">
              <Button variant="ghost" onClick={() => navigate('/scanner')} className="h-auto p-0 w-full">
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-md cursor-pointer w-full">
                  <CardContent className="p-6 md:p-4 text-center">
                    <Camera className="h-10 w-10 md:h-8 md:w-8 mx-auto mb-3 md:mb-2 text-primary" />
                    <h3 className="font-semibold text-base md:text-sm mb-1">{sc.startScanning}</h3>
                    <p className="text-sm md:text-xs text-muted-foreground">{sc.startScanningDesc}</p>
                  </CardContent>
                </Card>
              </Button>
              <Button variant="ghost" onClick={() => navigate('/community')} className="h-auto p-0 w-full">
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-md cursor-pointer w-full">
                  <CardContent className="p-6 md:p-4 text-center">
                    <Users className="h-10 w-10 md:h-8 md:w-8 mx-auto mb-3 md:mb-2 text-primary" />
                    <h3 className="font-semibold text-base md:text-sm mb-1">{sc.discoverCommunity}</h3>
                    <p className="text-sm md:text-xs text-muted-foreground">{sc.discoverCommunityDesc}</p>
                  </CardContent>
                </Card>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground"><p>{sc.helpQuestion}</p></div>
          </div>
        );

      default:
        return <div>{sc.stepNotFound}</div>;
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      {renderStepContent()}
    </div>
  );
};
