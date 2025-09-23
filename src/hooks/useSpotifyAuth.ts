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

    console.log('🎵 Starting Spotify connection...');
    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      // First get Spotify configuration from Edge Function
      console.log('📡 Getting Spotify configuration...');
      const { data: configData, error: configError } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'get_config' },
      });

      if (configError) {
        console.error('❌ Config error:', configError);
        throw new Error(`Configuration error: ${configError.message}`);
      }

      if (!configData?.client_id) {
        console.error('❌ No client ID in config response:', configData);
        throw new Error('Spotify Client ID not configured');
      }

      const clientId = configData.client_id;
      console.log('✅ Got Spotify Client ID:', clientId);

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Redirect URL (must match Spotify app settings exactly)
      const redirectUri = `${window.location.origin}/auth/spotify/callback`;
      console.log('🔗 Using redirect URI:', redirectUri);
      
      // Store both code verifier and redirect URI for later use
      localStorage.setItem('spotify_code_verifier', codeVerifier);
      localStorage.setItem('spotify_redirect_uri', redirectUri);
      console.log('💾 Stored auth data in localStorage');
      
      const params = new URLSearchParams({
        client_id: clientId,
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
      console.log('🚀 Attempting Spotify redirect:', spotifyAuthUrl);
      
      // Try multiple redirect methods to handle iframe restrictions
      let redirectSuccess = false;
      
      // Method 1: Try top-level window redirect (best for iframes)
      try {
        if (window.top && window.top !== window) {
          console.log('🌐 Method 1: Redirecting in top-level window (iframe detected)');
          window.top.location.href = spotifyAuthUrl;
          redirectSuccess = true;
        }
      } catch (securityError) {
        console.log('⚠️ Method 1 failed (SecurityError):', securityError.message);
      }
      
      // Method 2: Try window.open in new tab
      if (!redirectSuccess) {
        try {
          console.log('🌐 Method 2: Opening in new tab');
          const popup = window.open(spotifyAuthUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
          if (popup) {
            redirectSuccess = true;
            toast.success('Spotify wordt geopend in een nieuw tabblad');
          } else {
            console.log('⚠️ Method 2 failed: Popup blocked');
          }
        } catch (popupError) {
          console.log('⚠️ Method 2 failed:', popupError.message);
        }
      }
      
      // Method 3: Try current window redirect (fallback)
      if (!redirectSuccess) {
        try {
          console.log('🌐 Method 3: Redirecting in current window');
          window.location.href = spotifyAuthUrl;
          redirectSuccess = true;
        } catch (redirectError) {
          console.log('⚠️ Method 3 failed:', redirectError.message);
        }
      }
      
      // Method 4: Create hidden anchor link (final fallback)
      if (!redirectSuccess) {
        console.log('🌐 Method 4: Using anchor link fallback');
        const link = document.createElement('a');
        link.href = spotifyAuthUrl;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Als Spotify niet opent, probeer het handmatig via de knop hierboven');
      }
    } catch (error) {
      console.error('❌ Error starting Spotify connection:', error);
      toast.error('Er ging iets mis bij het verbinden met Spotify');
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleCallback = async (code: string, state: string) => {
    console.log('🔄 Handling Spotify callback...', { code: code?.substring(0, 10) + '...', state });
    
    if (!user || state !== user.id) {
      console.error('❌ Invalid authentication state:', { user: user?.id, state });
      toast.error('Ongeldige authenticatie status');
      return;
    }

    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    const storedRedirectUri = localStorage.getItem('spotify_redirect_uri');
    
    if (!codeVerifier) {
      console.error('❌ Code verifier not found in localStorage');
      toast.error('Authenticatie gegevens niet gevonden');
      return;
    }

    // Use stored redirect URI if available, fallback to current origin
    const redirectUri = storedRedirectUri || `${window.location.origin}/auth/spotify/callback`;
    console.log('✅ Using stored redirect URI:', redirectUri);
    console.log('🔄 Starting token exchange with Edge Function...');

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        },
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from Edge Function');
        throw new Error('No data returned from Spotify authentication');
      }

      console.log('✅ Token exchange successful:', { has_access_token: !!data.access_token, user_id: data.user_data?.id });

      const tokenData = data as SpotifyTokenResponse;
      
      // Update user profile with Spotify connection
      console.log('📝 Updating user profile...');
      const { error: profileError } = await supabase
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

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }

      console.log('✅ Profile updated successfully');

      // Clean up localStorage
      localStorage.removeItem('spotify_code_verifier');
      localStorage.removeItem('spotify_redirect_uri');
      console.log('🧹 Cleaned up localStorage auth data');
      
      setState(prev => ({ ...prev, isConnected: true }));
      toast.success('Spotify succesvol gekoppeld!');

      // Trigger initial sync
      console.log('🔄 Starting initial Spotify sync...');
      await syncSpotifyData();
    } catch (error) {
      console.error('❌ Error completing Spotify authentication:', error);
      toast.error('Er ging iets mis bij het voltooien van de Spotify koppeling');
    }
  };

  const syncSpotifyData = async () => {
    if (!user) return;

    console.log('🔄 Starting Spotify data sync...');

    try {
      const { data, error } = await supabase.functions.invoke('spotify-sync', {
        body: { user_id: user.id },
      });

      if (error) {
        console.error('❌ Spotify sync error:', error);
        
        // Check if re-authorization is needed
        if (error.message?.includes('needs_reauth') || error.message?.includes('refresh')) {
          toast.error('Spotify autorisatie verlopen. Klik op "Herautoriseer Spotify" om opnieuw te verbinden.');
          setState(prev => ({ ...prev, isConnected: false }));
          return { needsReauth: true };
        }
        
        throw error;
      }
      
      console.log('✅ Spotify data sync completed:', data);
      
      if (data?.counts) {
        const { playlists, tracks, topTracks, topArtists } = data.counts;
        toast.success(`Spotify gesynchroniseerd: ${playlists} playlists, ${tracks} tracks, ${topTracks} top tracks, ${topArtists} top artiesten`);
      } else {
        toast.success('Spotify data gesynchroniseerd');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error syncing Spotify data:', error);
      toast.error('Er ging iets mis bij het synchroniseren van Spotify data');
      return { success: false, error };
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

  const getManualSpotifyUrl = () => {
    const storedRedirectUri = localStorage.getItem('spotify_redirect_uri');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    
    if (!storedRedirectUri || !codeVerifier) {
      console.log('⚠️ No stored auth data for manual URL');
      return null;
    }
    
    // We would need to get the client ID and regenerate the URL
    // For now, return null - the user should try connecting again
    console.log('📋 Manual URL requested but requires fresh auth flow');
    return null;
  };

  return {
    ...state,
    connectSpotify,
    disconnectSpotify,
    handleCallback,
    syncSpotifyData,
    getManualSpotifyUrl,
  };
};