import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterPopupFormProps {
  onSuccess?: () => void;
  source?: string;
  sourcePage?: string;
}

export function NewsletterPopupForm({ onSuccess, source = 'popup', sourcePage }: NewsletterPopupFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({
        title: 'Ongeldig e-mailadres',
        description: 'Voer een geldig e-mailadres in.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase().trim(),
          source,
          source_page: sourcePage || window.location.pathname,
        });

      if (insertError) {
        // Check for duplicate email
        if (insertError.code === '23505') {
          toast({
            title: 'Al ingeschreven',
            description: 'Dit e-mailadres is al ingeschreven voor onze nieuwsbrief.',
          });
          localStorage.setItem('newsletter_subscribed', 'true');
          setIsSuccess(true);
          setTimeout(() => onSuccess?.(), 1500);
          return;
        }
        throw insertError;
      }

      // Send welcome email via edge function
      try {
        await supabase.functions.invoke('send-newsletter-welcome', {
          body: { email: email.toLowerCase().trim(), source }
        });
        
        // Update record to mark welcome email as sent
        await supabase
          .from('newsletter_subscribers')
          .update({ 
            welcome_email_sent: true, 
            welcome_email_sent_at: new Date().toISOString() 
          })
          .eq('email', email.toLowerCase().trim());
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email fails
      }

      // Mark as subscribed in localStorage
      localStorage.setItem('newsletter_subscribed', 'true');
      
      setIsSuccess(true);
      toast({
        title: 'Ingeschreven!',
        description: 'Bedankt! Check je inbox voor een welkomstmail.',
      });

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
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
