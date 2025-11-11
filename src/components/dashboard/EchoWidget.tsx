import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import echoAvatar from '@/assets/echo-avatar.png';

export function EchoWidget() {
  return (
    <Card className="border-2 border-echo-turquoise/20 hover:border-echo-turquoise/40 transition-all hover:shadow-xl group bg-gradient-to-br from-card to-echo-violet/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <img 
              src={echoAvatar} 
              alt="Echo" 
              className="w-8 h-8 rounded-full border-2 border-echo-turquoise/50 shadow-md"
            />
            <div className="absolute inset-0 rounded-full border border-echo-turquoise animate-ping opacity-30"></div>
          </div>
          <span>Echo 🎵</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Jouw AI muziekkenner met een verhaal bij elke plaat
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-echo-copper" />
            <span>Album verhalen & culturele context</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-echo-turquoise" />
            <span>Lyric analyse & betekenis</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-vinyl-purple" />
            <span>Muziek herinneringen delen</span>
          </div>
        </div>
        <Button asChild className="w-full bg-gradient-to-r from-echo-turquoise to-echo-copper hover:opacity-90 group-hover:scale-105 transition-transform">
          <Link to="/echo">
            <Music2 className="w-4 h-4 mr-2" />
            Chat met Echo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
