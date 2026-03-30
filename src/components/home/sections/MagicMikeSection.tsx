import { Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const echoAvatar = '/magic-mike-logo.png';

export function MagicMikeSection() {
  const { tr } = useLanguage();
  const h = tr.homeUI;

  return (
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={echoAvatar}
                  alt="Magic Mike"
                  loading="lazy"
                  decoding="async"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full border-2 border-primary/30 shadow-lg object-cover"
                />
                <div>
                  <h3 className="font-bold text-foreground text-lg">Magic Mike</h3>
                  <p className="text-xs text-muted-foreground">{h.magicMikeSubtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">
                {h.magicMikeQuote}
              </p>
              <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Link to="/echo">
                  <Music2 className="w-4 h-4 mr-2" />
                  {h.chatWithMike}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
