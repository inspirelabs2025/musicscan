import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Gift, Music, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdventDay {
  day_number: number;
  title: string;
  description: string | null;
  content_type: string;
  content_data: any;
  image_url: string | null;
  is_unlocked: boolean;
}

const DEFAULT_ADVENT_CONTENT: AdventDay[] = Array.from({ length: 24 }, (_, i) => ({
  day_number: i + 1,
  title: `Dag ${i + 1}`,
  description: 'Een speciale kerst verrassing wacht op je!',
  content_type: 'teaser',
  content_data: null,
  image_url: null,
  is_unlocked: new Date().getDate() >= i + 1 && new Date().getMonth() === 11
}));

export const ChristmasAdventCalendar = () => {
  const [days, setDays] = useState<AdventDay[]>(DEFAULT_ADVENT_CONTENT);
  const [selectedDay, setSelectedDay] = useState<AdventDay | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAdventContent();
  }, []);

  const fetchAdventContent = async () => {
    try {
      const { data, error } = await supabase
        .from('christmas_advent_calendar')
        .select('*')
        .eq('year', new Date().getFullYear())
        .order('day_number');

      if (data && data.length > 0) {
        const today = new Date().getDate();
        const isDecember = new Date().getMonth() === 11;
        
        setDays(data.map(day => ({
          ...day,
          is_unlocked: isDecember && today >= day.day_number
        })));
      }
    } catch (error) {
      console.error('Failed to fetch advent content:', error);
    }
  };

  const handleDayClick = (day: AdventDay) => {
    if (day.is_unlocked) {
      setSelectedDay(day);
      setIsOpen(true);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'song': return <Music className="h-4 w-4" />;
      case 'fact': return <Star className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-red-900/20 to-green-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            📅 Advent Kalender 2024
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ontdek elke dag een muzikale verrassing tot aan Kerst!
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {days.map((day) => (
              <button
                key={day.day_number}
                onClick={() => handleDayClick(day)}
                disabled={!day.is_unlocked}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center p-2 transition-all ${
                  day.is_unlocked
                    ? 'bg-gradient-to-br from-red-600 to-green-600 hover:scale-105 cursor-pointer'
                    : 'bg-muted/30 cursor-not-allowed'
                }`}
              >
                {day.is_unlocked ? (
                  <>
                    <span className="text-xl font-bold">{day.day_number}</span>
                    <Gift className="h-4 w-4 mt-1" />
                  </>
                ) : (
                  <>
                    <span className="text-lg font-medium text-muted-foreground">{day.day_number}</span>
                    <Lock className="h-3 w-3 mt-1 text-muted-foreground" />
                  </>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🎄 Dag {selectedDay?.day_number}
              <Badge variant="secondary" className="ml-2">
                {getContentIcon(selectedDay?.content_type || 'gift')}
                {selectedDay?.content_type}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDay?.image_url && (
              <img 
                src={selectedDay.image_url} 
                alt={selectedDay.title}
                className="w-full rounded-lg"
              />
            )}
            <h3 className="text-lg font-semibold">{selectedDay?.title}</h3>
            <p className="text-muted-foreground">{selectedDay?.description}</p>
            {selectedDay?.content_data && (
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(selectedDay.content_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
