import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/scanner');
    }
  }, [user, loading, navigate]);

  // Handle password reset flow
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setActiveTab('reset');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Onjuiste email of wachtwoord');
        } else {
          setError(error.message);
        }
      } else {
        toast.success('Succesvol ingelogd!');
        navigate('/scanner');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
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
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
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
  );
};

export default Auth;