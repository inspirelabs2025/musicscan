import React, { useState } from 'react';
import { Mail, Loader2, User, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuizCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  totalQuestions: number;
  percentage: number;
  badge: { title: string; emoji: string; color: string };
  quizType: string;
  onAccountCreated: (userId: string) => void;
}

export function QuizCompletionDialog({
  open,
  onOpenChange,
  score,
  totalQuestions,
  percentage,
  badge,
  quizType,
  onAccountCreated,
}: QuizCompletionDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "E-mailadres verplicht",
        description: "Vul je e-mailadres in om je score op te slaan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create account with random password (user will set via email link)
      const randomPassword = crypto.randomUUID();
      const redirectUrl = `${window.location.origin}/auth/set-password`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName || undefined,
          }
        }
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes('already registered')) {
          toast({
            title: "Account bestaat al",
            description: "Log in om je score op te slaan, of gebruik een ander e-mailadres.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Account aanmaken mislukt');
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.warn('Password reset email failed:', resetError);
      }

      // Send custom quiz registration email with score
      try {
        await supabase.functions.invoke('send-quiz-registration-email', {
          body: {
            email,
            firstName: firstName || undefined,
            quizScore: score,
            quizTotal: totalQuestions,
            quizPercentage: percentage,
            quizType,
            badgeTitle: badge.title,
            badgeEmoji: badge.emoji,
          }
        });
      } catch (emailError) {
        console.warn('Quiz registration email failed:', emailError);
      }

      setIsSuccess(true);
      
      // Call callback with new user ID
      onAccountCreated(signUpData.user.id);

      toast({
        title: "Account aangemaakt!",
        description: "Check je e-mail om je wachtwoord in te stellen.",
      });

    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Er ging iets mis",
        description: error.message || "Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Account Aangemaakt!</h3>
            <p className="text-muted-foreground mb-4">
              Je score is opgeslagen. Check je e-mail ({email}) om je wachtwoord in te stellen.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                Je kunt nu je resultaten bekijken en delen. Log later in met je e-mail en wachtwoord om toegang te krijgen tot al je quiz scores.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Bekijk Resultaten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-3xl">{badge.emoji}</span>
            Gefeliciteerd!
          </DialogTitle>
          <DialogDescription>
            Je scoorde {percentage}% op de {quizType} Quiz
          </DialogDescription>
        </DialogHeader>

        <div className={`p-4 rounded-lg ${badge.color} mb-4`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{badge.emoji}</span>
            <div>
              <p className="font-semibold">{badge.title}</p>
              <p className="text-sm opacity-80">Badge verdiend!</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Sla je score op en bekijk je volledige quiz geschiedenis! Je ontvangt een e-mail om je wachtwoord in te stellen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam (optioneel)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Je voornaam"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-purple-600"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Account aanmaken...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Account Aanmaken & Opslaan
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              ✉️ Je ontvangt een e-mail om je wachtwoord in te stellen
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
