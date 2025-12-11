import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Music, Utensils, Gift, Home, Star } from 'lucide-react';

const NL_TRADITIONS = [
  {
    id: 'sinterklaas',
    icon: <Gift className="h-5 w-5" />,
    title: 'Sinterklaas vs Kerst',
    emoji: '🎅',
    content: `In Nederland is Sinterklaas (5 december) traditioneel het belangrijkste cadeau-feest. Pas de laatste decennia is het geven van kerstcadeaus populairder geworden, mede door Amerikaanse invloeden via films en muziek.`,
    songs: ['Zie ginds komt de stoomboot', 'Sinterklaas kapoentje'],
    funFact: 'Veel Nederlandse gezinnen vieren nu beide feesten!'
  },
  {
    id: 'kerstdiner',
    icon: <Utensils className="h-5 w-5" />,
    title: 'Kerstdiner & Gourmetten',
    emoji: '🍽️',
    content: `Het Nederlandse kerstdiner kent twee populaire vormen: het traditionele drie-gangen diner en het gourmetten. Gourmetten werd in de jaren 70 populair en is nu een vast onderdeel van veel Nederlandse kerstdiners.`,
    songs: ['Kerstmis met de hele familie'],
    funFact: 'Nederland is het land met de meeste gourmetstellen per huishouden!'
  },
  {
    id: 'kerstboom',
    icon: <Home className="h-5 w-5" />,
    title: 'De Kerstboom',
    emoji: '🎄',
    content: `De traditie van de kerstboom komt uit Duitsland en werd in de 19e eeuw populair in Nederland. Koningin Emma introduceerde de verlichte kerstboom aan het Nederlandse hof.`,
    songs: ['O dennenboom', 'Stille nacht'],
    funFact: 'Er worden jaarlijks zo\'n 2,5 miljoen kerstbomen verkocht in Nederland!'
  },
  {
    id: 'kerst-tv',
    icon: <Star className="h-5 w-5" />,
    title: 'Kerst TV Specials',
    emoji: '📺',
    content: `Nederlanders kijken massaal naar kerst-specials. The Sound of Music, All You Need Is Love kerstspecial, en diverse concerten zijn jaarlijks terugkerende klassiekers.`,
    songs: ['De muziek van de Sound of Music'],
    funFact: 'De All You Need Is Love kerstspecial trekt jaarlijks miljoenen kijkers!'
  },
  {
    id: 'kerstmuziek',
    icon: <Music className="h-5 w-5" />,
    title: 'Nederlandse Kerstmuziek',
    emoji: '🎵',
    content: `Naast internationale hits hebben we ook typisch Nederlandse kerstnummers. Van klassiekers als "Midden in de winternacht" tot moderne hits van Nederlandse artiesten.`,
    songs: ['Midden in de winternacht', 'Kerstmis met jou - Jim Bakkum', 'December - Guus Meeuwis'],
    funFact: 'Radio 2 draait elk jaar de Top 2000 met veel kerstnummers in de lijst!'
  },
];

export const ChristmasNLTraditions = () => {
  return (
    <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          🇳🇱 Nederlandse Kerst Tradities
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ontdek de unieke manier waarop Nederland kerst viert
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {NL_TRADITIONS.map((tradition) => (
            <AccordionItem key={tradition.id} value={tradition.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tradition.emoji}</span>
                  <span className="font-medium">{tradition.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tradition.content}
                  </p>

                  {/* Associated Songs */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Gerelateerde muziek:</span>
                    {tradition.songs.map((song) => (
                      <Badge key={song} variant="secondary" className="text-xs">
                        <Music className="h-3 w-3 mr-1" /> {song}
                      </Badge>
                    ))}
                  </div>

                  {/* Fun Fact */}
                  <div className="bg-orange-500/10 rounded-lg p-3">
                    <p className="text-sm flex items-start gap-2">
                      <Star className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tradition.funFact}</span>
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
