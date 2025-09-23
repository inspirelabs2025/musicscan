import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SpotifyAuthState {
  isConnecting: boolean;
  isDisconnecting: boolean;
  isConnected: boolean;
}

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  user_data: {
    id: string;
    display_name: string;
    email: string;
  };
}

export const useSpotifyAuth = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SpotifyAuthState>({
    isConnecting: false,
    isDisconnecting: false,
    isConnected: false,
  });

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const connectSpotify = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om Spotify te koppelen');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later use
      localStorage.setItem('spotify_code_verifier', codeVerifier);
      
      // Redirect URL (must match Spotify app settings)
      const redirectUri = `${window.location.origin}/auth/spotify/callback`;
      
      const params = new URLSearchParams({
        client_id: '4b4f4c4e4a4d4b4e4a4d4b4e4a4d4b4e', // Will be replaced with actual client ID
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: [
          'user-read-private',
          'user-read-email',
          'user-library-read',
          'playlist-read-private',
          'user-top-read',
          'user-read-recently-played'
        ].join(' '),
        state: user.id, // Include user ID for security
      });

      const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params}`;
      window.location.href = spotifyAuthUrl;
    } catch (error) {
      console.error('Error initiating Spotify connection:', error);
      toast.error('Er ging iets mis bij het verbinden met Spotify');
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleCallback = async (code: string, state: string) => {
    if (!user || state !== user.id) {
      toast.error('Ongeldige authenticatie status');
      return;
    }

    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      toast.error('Authenticatie gegevens niet gevonden');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          code,
          code_verifier: codeVerifier,
          redirect_uri: `${window.location.origin}/auth/spotify/callback`,
        },
      });

      if (error) throw error;

      const tokenData = data as SpotifyTokenResponse;
      
      // Update user profile with Spotify connection
      await supabase
        .from('profiles')
        .update({
          spotify_connected: true,
          spotify_user_id: tokenData.user_data.id,
          spotify_display_name: tokenData.user_data.display_name,
          spotify_email: tokenData.user_data.email,
          spotify_refresh_token: tokenData.refresh_token,
          spotify_last_sync: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      localStorage.removeItem('spotify_code_verifier');
      setState(prev => ({ ...prev, isConnected: true }));
      toast.success('Spotify succesvol gekoppeld!');

      // Trigger initial sync
      await syncSpotifyData();
    } catch (error) {
      console.error('Error completing Spotify authentication:', error);
      toast.error('Er ging iets mis bij het voltooien van de Spotify koppeling');
    }
  };

  const syncSpotifyData = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('spotify-sync', {
        body: { user_id: user.id },
      });

      if (error) throw error;
      toast.success('Spotify data wordt gesynchroniseerd op de achtergrond');
    } catch (error) {
      console.error('Error syncing Spotify data:', error);
      toast.error('Er ging iets mis bij het synchroniseren van Spotify data');
    }
  };

  const disconnectSpotify = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isDisconnecting: true }));

    try {
      // Clear Spotify data from profile
      await supabase
        .from('profiles')
        .update({
          spotify_connected: false,
          spotify_user_id: null,
          spotify_display_name: null,
          spotify_email: null,
          spotify_refresh_token: null,
          spotify_last_sync: null,
        })
        .eq('user_id', user.id);

      // Delete user's Spotify data
      await Promise.all([
        supabase.from('spotify_playlists').delete().eq('user_id', user.id),
        supabase.from('spotify_tracks').delete().eq('user_id', user.id),
        supabase.from('spotify_user_stats').delete().eq('user_id', user.id),
      ]);

      setState(prev => ({ ...prev, isConnected: false }));
      toast.success('Spotify koppeling verbroken');
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      toast.error('Er ging iets mis bij het verbreken van de Spotify koppeling');
    } finally {
      setState(prev => ({ ...prev, isDisconnecting: false }));
    }
  };

  return {
    ...state,
    connectSpotify,
    disconnectSpotify,
    handleCallback,
    syncSpotifyData,
  };
};