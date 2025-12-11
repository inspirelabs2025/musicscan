import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Vote, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  is_active: boolean;
}

const DEFAULT_POLL: Poll = {
  id: 'default',
  question: 'Wat is jouw favoriete kersthit aller tijden?',
  options: [
    { id: '1', text: 'Last Christmas - Wham!', votes: 234 },
    { id: '2', text: 'All I Want For Christmas Is You - Mariah Carey', votes: 312 },
    { id: '3', text: 'Driving Home For Christmas - Chris Rea', votes: 156 },
    { id: '4', text: 'Fairytale of New York - The Pogues', votes: 189 },
    { id: '5', text: 'White Christmas - Bing Crosby', votes: 98 },
  ],
  total_votes: 989,
  is_active: true
};

export const ChristmasPoll = () => {
  const [poll, setPoll] = useState<Poll>(DEFAULT_POLL);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActivePoll();
    checkIfVoted();
  }, []);

  const fetchActivePoll = async () => {
    try {
      const { data, error } = await supabase
        .from('christmas_polls')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPoll({
          ...data,
          options: (data.options as unknown as PollOption[]) || DEFAULT_POLL.options
        });
      }
    } catch (error) {
      console.error('Failed to fetch poll:', error);
    }
  };

  const checkIfVoted = () => {
    const votedPolls = localStorage.getItem('christmas_poll_votes');
    if (votedPolls) {
      const votes = JSON.parse(votedPolls);
      if (votes[poll.id]) {
        setHasVoted(true);
        setSelectedOption(votes[poll.id]);
      }
    }
  };

  const handleVote = async (optionId: string) => {
    if (hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedOption(optionId);

    try {
      // Update local state immediately for better UX
      setPoll(prev => ({
        ...prev,
        options: prev.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        total_votes: prev.total_votes + 1
      }));

      // Store vote in database
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);

      await supabase.from('christmas_poll_votes').insert({
        poll_id: poll.id !== 'default' ? poll.id : null,
        session_id: sessionId,
        selected_options: [optionId]
      });

      // Store vote locally to prevent double voting
      const votedPolls = JSON.parse(localStorage.getItem('christmas_poll_votes') || '{}');
      votedPolls[poll.id] = optionId;
      localStorage.setItem('christmas_poll_votes', JSON.stringify(votedPolls));

      setHasVoted(true);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((votes / poll.total_votes) * 100);
  };

  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  const winningOption = sortedOptions[0];

  return (
    <Card className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border-violet-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          📊 Kerst Muziek Poll
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Stem op jouw favoriete kerstmuziek!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-1">{poll.question}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Vote className="h-4 w-4" /> {poll.total_votes} stemmen
          </p>
        </div>

        <div className="space-y-3">
          {sortedOptions.map((option, index) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;
            const isWinning = option.id === winningOption.id && hasVoted;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || isSubmitting}
                className={`w-full p-4 rounded-lg text-left transition-all relative overflow-hidden ${
                  hasVoted 
                    ? isSelected 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'bg-muted/20'
                    : 'bg-muted/20 hover:bg-muted/40 cursor-pointer'
                }`}
              >
                {/* Progress Bar Background */}
                {hasVoted && (
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      isWinning ? 'bg-green-500/20' : 'bg-primary/10'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge 
                      variant={isWinning ? 'default' : 'secondary'} 
                      className="shrink-0"
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm truncate">{option.text}</span>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  {hasVoted && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold">{percentage}%</span>
                      <span className="text-xs text-muted-foreground">({option.votes})</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium">Bedankt voor je stem!</p>
            <p className="text-sm text-muted-foreground">
              De huidige koploper is: <strong>{winningOption.text}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
