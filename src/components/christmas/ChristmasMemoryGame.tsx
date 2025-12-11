import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemoryCard {
  id: number;
  artist: string;
  song: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CHRISTMAS_SONGS = [
  { artist: 'Wham!', song: 'Last Christmas', emoji: '🎄' },
  { artist: 'Mariah Carey', song: 'All I Want For Christmas', emoji: '🎅' },
  { artist: 'Band Aid', song: 'Do They Know It\'s Christmas', emoji: '🌟' },
  { artist: 'Bing Crosby', song: 'White Christmas', emoji: '❄️' },
  { artist: 'Chris Rea', song: 'Driving Home For Christmas', emoji: '🚗' },
  { artist: 'John Lennon', song: 'Happy Xmas', emoji: '☮️' },
  { artist: 'Slade', song: 'Merry Xmas Everybody', emoji: '🔔' },
  { artist: 'The Pogues', song: 'Fairytale of New York', emoji: '🗽' },
];

export const ChristmasMemoryGame = () => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    const shuffledCards = [...CHRISTMAS_SONGS, ...CHRISTMAS_SONGS]
      .sort(() => Math.random() - 0.5)
      .map((song, index) => ({
        id: index,
        ...song,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setIsPlaying(true);
    setIsComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isComplete) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isComplete]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.artist === secondCard.artist) {
        setCards(prev => prev.map(card =>
          card.artist === firstCard.artist ? { ...card, isMatched: true } : card
        ));
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second ? { ...card, isFlipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(m => m + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setIsComplete(true);
      setIsPlaying(false);
      saveScore();
    }
  }, [cards]);

  const saveScore = async () => {
    const score = Math.max(1000 - (moves * 10) - (time * 2), 100);
    try {
      await supabase.from('christmas_memory_scores').insert({
        moves,
        time_seconds: time,
        score,
        difficulty: 'normal',
        session_id: crypto.randomUUID()
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;
    
    setCards(prev => prev.map((card, i) =>
      i === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-br from-red-900/20 to-green-900/20 border-red-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          🎮 Kerst Muziek Memory
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {formatTime(time)}
          </Badge>
          <Badge variant="outline">Zetten: {moves}</Badge>
          <Button size="sm" variant="outline" onClick={initializeGame}>
            <RotateCcw className="h-4 w-4 mr-1" /> Opnieuw
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">🎉 Gefeliciteerd!</h3>
            <p className="text-muted-foreground mb-4">
              Je hebt het spel voltooid in {moves} zetten en {formatTime(time)}!
            </p>
            <Button onClick={initializeGame}>Nog een keer spelen</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`aspect-square rounded-lg text-center p-2 transition-all duration-300 transform ${
                  card.isFlipped || card.isMatched
                    ? 'bg-gradient-to-br from-green-600 to-red-600 rotate-0 scale-100'
                    : 'bg-gradient-to-br from-red-800 to-green-800 hover:scale-105'
                } ${card.isMatched ? 'opacity-60' : ''}`}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">{card.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{card.artist}</span>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-3xl">🎁</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
