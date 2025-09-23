import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleCallback } = useSpotifyAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Spotify authenticatie geannuleerd');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Ongeldige authenticatie gegevens');
        return;
      }

      if (!user || state !== user.id) {
        setStatus('error');
        setMessage('Authenticatie status klopt niet');
        return;
      }

      try {
        await handleCallback(code, state);
        setStatus('success');
        setMessage('Spotify succesvol gekoppeld!');
        
        // Redirect to Spotify profile after success
        setTimeout(() => {
          navigate('/spotify-profile');
        }, 2000);
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('Er ging iets mis bij het koppelen van Spotify');
      }
    };

    processCallback();
  }, [searchParams, user, handleCallback, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Spotify koppelen...';
      case 'success':
        return 'Succesvol gekoppeld!';
      case 'error':
        return 'Koppeling mislukt';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Music className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Dit kan even duren...
            </p>
          )}
          
          {status === 'success' && (
            <p className="text-sm text-green-600">
              Je wordt doorgestuurd naar je Spotify profiel...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                Terug naar Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}