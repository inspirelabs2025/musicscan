import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [state, setState] = useState<SpotifyAuthState>({
    isConnecting: false,
    isDisconnecting: false,
    isConnected: false,
  });

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

      // Redirect URL (must match Spotify app settings exactly)
      // Use musicscan.app without www to match Spotify Dashboard config
      const redirectUri = 'https://musicscan.app/auth/spotify/callback';
      console.log('🔗 Using redirect URI:', redirectUri);
      
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
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
      console.log('🚀 Redirecting to Spotify:', spotifyAuthUrl);
      
      // Always redirect in the current window - popups break OAuth because 
      // the callback page in a popup doesn't share auth session
      window.location.href = spotifyAuthUrl;
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

    const redirectUri = 'https://musicscan.app/auth/spotify/callback';
    console.log('🔄 Starting token exchange with Edge Function...');

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          code,
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
          spotify_last_sync: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }

      // Store refresh token + email in private user_spotify_tokens table
      const { error: tokenError } = await supabase
        .from('user_spotify_tokens')
        .upsert({
          user_id: user.id,
          spotify_refresh_token: tokenData.refresh_token,
          spotify_email: tokenData.user_data.email,
        }, { onConflict: 'user_id' });

      if (tokenError) {
        console.error('❌ Spotify token store error:', tokenError);
        throw tokenError;
      }

      console.log('✅ Profile updated successfully');

      // Invalidate profile cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      console.log('🔄 Invalidated profile cache');

      console.log('✅ Spotify connection complete');
      
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
        
        // Robust detection for re-authorization needed
        const errAny: any = error as any;
        const ctxBody = (errAny?.context?.body || errAny?.context?.responseBody || '').toString();
        const combined = `${errAny?.message || ''} ${ctxBody}`.toLowerCase();
        const reauthHints = ['needs_reauth', 'invalid_grant', 'refresh token revoked', 're-authorize'];
        const needsReauth = reauthHints.some(h => combined.includes(h));
        
        if (needsReauth) {
          toast.error('Spotify autorisatie verlopen. Klik op "Herautoriseer Spotify" om opnieuw te verbinden.');
          setState(prev => ({ ...prev, isConnected: false }));
          return { needsReauth: true } as const;
        }
        
        throw error;
      }
      
      console.log('✅ Spotify data sync completed:', data);
      
      if (data?.success) {
        const success = data.success;
        const errors = data.errors || {};
        
        // Show success message with counts
        if (Object.keys(success).length > 0) {
          const successParts = [];
          if (success.playlists) successParts.push(`${success.playlists} playlists`);
          if (success.tracks) successParts.push(`${success.tracks} tracks`);
          if (success.topTracks) successParts.push(`${success.topTracks} top tracks`);
          if (success.topArtists) successParts.push(`${success.topArtists} top artiesten`);
          
          if (successParts.length > 0) {
            toast.success(`✅ Spotify gesynchroniseerd: ${successParts.join(', ')}`);
          }
        }
        
        // Show error messages if any
        if (Object.keys(errors).length > 0) {
          const errorParts = Object.entries(errors).map(([key, msg]) => `${key}: ${msg}`);
          toast.error(`⚠️ Sommige data kon niet worden gesynchroniseerd: ${errorParts.join('; ')}`, {
            duration: 7000,
          });
        }
      } else if (data?.counts) {
        // Fallback for old response format
        const { playlists, tracks, topTracks, topArtists } = data.counts;
        toast.success(`Spotify gesynchroniseerd: ${playlists} playlists, ${tracks} tracks, ${topTracks} top tracks, ${topArtists} top artiesten`);
      } else {
        toast.success('Spotify data gesynchroniseerd');
      }
      
      // Invalidate AI analysis cache to force refresh with new Spotify data
      queryClient.invalidateQueries({ queryKey: ['collection-ai-analysis'] });
      
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

      // Invalidate profile cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['profile'] });

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