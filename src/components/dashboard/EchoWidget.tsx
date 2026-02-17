import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
const echoAvatar = '/magic-mike-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

export function EchoWidget() {
  const { tr } = useLanguage();

  return (
    <Card className="border-2 border-echo-turquoise/20 hover:border-echo-turquoise/40 transition-all hover:shadow-xl group bg-gradient-to-br from-card to-echo-violet/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <img 
              src={echoAvatar} 
               alt="Magic Mike" 
               className="w-8 h-8 rounded-full border-2 border-echo-turquoise/50 shadow-md"
             />
             <div className="absolute inset-0 rounded-full border border-echo-turquoise animate-ping opacity-30"></div>
           </div>
           <span>Magic Mike 🎩</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {tr.echo.subtitle}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-echo-copper" />
            <span>{tr.echo.albumStories}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-echo-turquoise" />
            <span>{tr.echo.lyricAnalysis}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-vinyl-purple" />
            <span>{tr.echo.musicMemories}</span>
          </div>
        </div>
        <Button asChild className="w-full bg-transparent border border-primary/30 text-foreground hover:bg-[hsl(271,81%,56%)] hover:text-white hover:border-transparent transition-all group-hover:scale-105">
          <Link to="/echo">
            <Music2 className="w-4 h-4 mr-2" />
            {tr.echo.chatWithEcho}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
