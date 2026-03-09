import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
const echoAvatar = '/magic-mike-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

export function EchoWidget() {
  const { tr } = useLanguage();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <img 
            src={echoAvatar} 
            alt="Magic Mike" 
            className="w-7 h-7 rounded-full border border-border"
          />
          Magic Mike
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {tr.echo.subtitle}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>{tr.echo.albumStories}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>{tr.echo.lyricAnalysis}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>{tr.echo.musicMemories}</span>
          </div>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to="/echo">
            <Music2 className="w-4 h-4 mr-2" />
            {tr.echo.chatWithEcho}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
