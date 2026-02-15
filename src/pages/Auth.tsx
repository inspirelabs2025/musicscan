import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Separator } from '@/components/ui/separator';

const Auth = () => {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Check if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Handle password reset flow and email confirmation
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setActiveTab('reset');
    }
    
    // Check if user returned from email confirmation
    if (searchParams.get('message') === 'Email bevestigd') {
      setShowConfirmationMessage(true);
      toast.success('Email bevestigd! Je kunt nu inloggen.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError('Er ging iets mis met Google inloggen.');
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Onjuiste email of wachtwoord');
        } else if (error.message === 'Email not confirmed') {
          setError('Email nog niet bevestigd. Check je inbox en klik op de bevestigingslink.');
        } else {
          setError(error.message);
        }
      } else {
        toast.success('Succesvol ingelogd!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Voer eerst je email adres in');
      return;
    }

    setIsResendingEmail(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success('Bevestigingsmail opnieuw verzonden!');
      }
    } catch (err) {
      setError('Er ging iets mis bij het verzenden van de bevestigingsmail.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters bevatten');
      setIsSubmitting(false);
      return;
    }

    if (!firstName.trim()) {
      setError('Voornaam is verplicht');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, firstName.trim());
      
      if (error) {
        if (error.message === 'User already registered') {
          setError('Er bestaat al een account met dit email adres');
        } else {
          setError(error.message);
        }
      } else {
        // Try to redeem promo code if provided (after signup, user may not be confirmed yet)
        if (promoCode.trim()) {
          try {
            const { data } = await supabase.rpc('redeem_promo_code', { p_code: promoCode.trim() });
            if (data?.success) {
              toast.success(`${data.credits} gratis credits ontvangen!`);
            }
          } catch (e) {
            console.warn('Promo code redemption after signup:', e);
          }
        }
        toast.success('Account aangemaakt! Check je email voor bevestiging.');
        setActiveTab('signin');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
      } else {
        toast.success('Reset link verzonden naar je email!');
        setActiveTab('signin');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Inloggen - MusicScan</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Vinyl Scanner</CardTitle>
          <CardDescription>
            Beheer je vinyl en CD collectie
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Inloggen</TabsTrigger>
              <TabsTrigger value="signup">Registreren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Doorgaan met Google
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  of
                </span>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {showConfirmationMessage && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Email bevestigd! Je kunt nu inloggen met je gegevens.
                    </AlertDescription>
                  </Alert>
                )}
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      {error.includes('Email nog niet bevestigd') && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendConfirmation}
                            disabled={isResendingEmail}
                          >
                            {isResendingEmail ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verzenden...
                              </>
                            ) : (
                              'Bevestigingsmail opnieuw sturen'
                            )}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inloggen...
                    </>
                  ) : (
                    'Inloggen'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setActiveTab('reset')}
                >
                  Wachtwoord vergeten?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Registreren met Google
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  of
                </span>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">Voornaam</Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo-code">Promocode (optioneel)</Label>
                  <Input
                    id="promo-code"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Bijv. WELKOM2026"
                    disabled={isSubmitting}
                    maxLength={30}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Heb je een code? Ontvang gratis scan credits!</p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registreren...
                    </>
                  ) : (
                    'Registreren'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Wachtwoord resetten</h3>
                <p className="text-sm text-muted-foreground">
                  Voer je email adres in om een reset link te ontvangen
                </p>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    'Reset link verzenden'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setActiveTab('signin')}
                >
                  Terug naar inloggen
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default Auth;