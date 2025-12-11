import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Share2, Sparkles } from 'lucide-react';

const CARD_TEMPLATES = [
  { id: 'classic', name: 'Klassiek', bg: 'from-red-600 to-green-600', emoji: '🎄' },
  { id: 'snow', name: 'Sneeuw', bg: 'from-blue-400 to-white', emoji: '❄️' },
  { id: 'gold', name: 'Goud', bg: 'from-yellow-500 to-orange-500', emoji: '⭐' },
  { id: 'cozy', name: 'Gezellig', bg: 'from-orange-600 to-red-800', emoji: '🔥' },
];

const MUSIC_QUOTES = [
  '"All I want for Christmas is you" - Mariah Carey',
  '"Last Christmas, I gave you my heart" - Wham!',
  '"Have yourself a merry little Christmas" - Judy Garland',
  '"It\'s the most wonderful time of the year" - Andy Williams',
  '"Let it snow, let it snow, let it snow" - Dean Martin',
];

export const ChristmasCardGenerator = () => {
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(CARD_TEMPLATES[0]);
  const [selectedQuote, setSelectedQuote] = useState(MUSIC_QUOTES[0]);

  const generateRandomQuote = () => {
    const randomQuote = MUSIC_QUOTES[Math.floor(Math.random() * MUSIC_QUOTES.length)];
    setSelectedQuote(randomQuote);
  };

  const handleDownload = () => {
    // In a real implementation, this would generate and download an image
    alert('Kaart downloaden wordt binnenkort toegevoegd!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kerst Kaart van MusicScan',
          text: `${recipientName ? `Voor ${recipientName}: ` : ''}${message || selectedQuote}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${message || selectedQuote} - Vrolijk Kerstfeest! 🎄`);
      alert('Gekopieerd naar klembord!');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-900/20 to-green-900/20 border-red-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          🎨 Kerst Kaart Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Maak een muzikale kerstkaart voor je geliefden
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-4 gap-2">
                {CARD_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`aspect-square rounded-lg bg-gradient-to-br ${template.bg} flex items-center justify-center text-2xl transition-all ${
                      selectedTemplate.id === template.id ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {template.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voor</Label>
              <Input
                placeholder="Naam ontvanger"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Van</Label>
              <Input
                placeholder="Jouw naam"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Boodschap</Label>
                <Button size="sm" variant="ghost" onClick={generateRandomQuote}>
                  <Sparkles className="h-3 w-3 mr-1" /> Willekeurig citaat
                </Button>
              </div>
              <Textarea
                placeholder="Typ je boodschap of gebruik een muziek citaat..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-background/50 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground italic">{selectedQuote}</p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div 
              className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${selectedTemplate.bg} p-6 flex flex-col justify-between shadow-xl`}
            >
              <div className="text-center">
                <span className="text-4xl">{selectedTemplate.emoji}</span>
                <h3 className="text-xl font-bold mt-2 text-white drop-shadow-lg">
                  Vrolijk Kerstfeest{recipientName ? `, ${recipientName}` : ''}!
                </h3>
              </div>
              
              <div className="text-center text-white/90 text-sm italic drop-shadow">
                {message || selectedQuote}
              </div>
              
              <div className="text-right text-white/80 text-sm">
                {senderName ? `Met liefs, ${senderName}` : '🎵 MusicScan'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" /> Delen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
