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
import { useLanguage } from '@/contexts/LanguageContext';

const Auth = () => {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tr } = useLanguage();
  const t = tr.authPage;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setActiveTab('reset');
    }
    if (searchParams.get('message') === 'Email bevestigd') {
      setShowConfirmationMessage(true);
      toast.success(t.emailConfirmed);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) { setError(error.message); setIsGoogleLoading(false); }
    } catch (err) {
      setError(t.googleError);
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
        if (error.message === 'Invalid login credentials') setError(t.incorrectCredentials);
        else if (error.message === 'Email not confirmed') setError(t.emailNotConfirmed);
        else setError(error.message);
      } else {
        toast.success(t.loginSuccess);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) { setError(t.enterEmailFirst); return; }
    setIsResendingEmail(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup', email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) setError(error.message);
      else toast.success(t.confirmationResent);
    } catch (err) {
      setError(t.resendError);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    if (password !== confirmPassword) { setError(t.passwordsNoMatch); setIsSubmitting(false); return; }
    if (password.length < 6) { setError(t.passwordMinLength); setIsSubmitting(false); return; }
    if (!firstName.trim()) { setError(t.firstNameRequired); setIsSubmitting(false); return; }
    try {
      const { error } = await signUp(email, password, firstName.trim());
      if (error) {
        if (error.message === 'User already registered') setError(t.accountExists);
        else setError(error.message);
      } else {
        if (promoCode.trim()) {
          try {
            const { data } = await supabase.rpc('redeem_promo_code', { p_code: promoCode.trim() });
            if (data?.success) toast.success(`${data.credits} ${t.freeCreditsReceived}`);
          } catch (e) { console.warn('Promo code redemption after signup:', e); }
        }
        toast.success(t.accountCreated);
        setActiveTab('signin');
      }
    } catch (err) {
      setError(t.genericError);
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
      if (error) setError(error.message);
      else { toast.success(t.resetLinkSent); setActiveTab('signin'); }
    } catch (err) {
      setError(t.genericError);
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

  const GoogleButton = ({ label }: { label: string }) => (
    <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
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
      {label}
    </Button>
  );

  const OrSeparator = () => (
    <div className="relative">
      <Separator />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
        {t.or}
      </span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t.metaTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
              <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <GoogleButton label={t.continueWithGoogle} />
              <OrSeparator />

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t.email}</Label>
                  <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {showConfirmationMessage && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>{t.emailConfirmed}</AlertDescription>
                  </Alert>
                )}
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      {error.includes(t.emailNotConfirmed.substring(0, 20)) && (
                        <div className="mt-2">
                          <Button type="button" variant="outline" size="sm" onClick={handleResendConfirmation} disabled={isResendingEmail}>
                            {isResendingEmail ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.resending}</>) : t.resendConfirmation}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.signingIn}</>) : t.signIn}
                </Button>
                
                <Button type="button" variant="link" className="w-full" onClick={() => setActiveTab('reset')}>
                  {t.forgotPassword}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <GoogleButton label={t.registerWithGoogle} />
              <OrSeparator />

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">{t.firstName}</Label>
                  <Input id="signup-firstname" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isSubmitting} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} minLength={6} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
                  <Input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting} minLength={6} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo-code">{t.promoCode}</Label>
                  <Input id="promo-code" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t.promoCodePlaceholder} disabled={isSubmitting} maxLength={30} className="uppercase" />
                  <p className="text-xs text-muted-foreground">{t.promoCodeHint}</p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.signingUp}</>) : t.signUp}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t.resetPassword}</h3>
                <p className="text-sm text-muted-foreground">{t.sendResetLink}</p>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t.email}</Label>
                  <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.sending}</>) : t.sendResetLink}
                </Button>
                
                <Button type="button" variant="link" className="w-full" onClick={() => setActiveTab('signin')}>
                  {t.backToLogin}
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
