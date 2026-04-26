import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspirelabs.musicscan',
  appName: 'MusicScan',
  webDir: 'dist',
  // NOTE: server.url is intentionally disabled for Play Store release builds.
  // Re-enable only for local hot-reload development against the Lovable sandbox:
  // server: {
  //   androidScheme: 'https',
  //   url: 'https://0638cdc3-ae41-4fe5-9a88-2b2d34d360f4.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6B21A8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#6B21A8',
    },
  },
};

export default config;
