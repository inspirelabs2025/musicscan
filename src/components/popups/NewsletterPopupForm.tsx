import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface NewsletterPopupFormProps {
  onSuccess?: () => void;
}

export function NewsletterPopupForm({ onSuccess }: NewsletterPopupFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Ongeldig e-mailadres',
        description: 'Voer een geldig e-mailadres in.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store email in localStorage for now (can be integrated with email service later)
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
      }

      // Mark as permanently dismissed after successful signup
      localStorage.setItem('newsletter_subscribed', 'true');
      
      setIsSuccess(true);
      toast({
        title: 'Ingeschreven!',
        description: 'Je ontvangt binnenkort onze nieuwsbrief.',
      });

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      toast({
        title: 'Er ging iets mis',
        description: 'Probeer het later opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-4 space-y-2">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-medium">Bedankt voor je inschrijving!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="jouw@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Bezig...
          </>
        ) : (
          'Inschrijven'
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        We respecteren je privacy. Je kunt je altijd uitschrijven.
      </p>
    </form>
  );
}
