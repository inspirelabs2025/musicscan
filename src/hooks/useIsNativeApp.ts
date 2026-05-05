/**
 * Detecteert of de gebruiker de native Capacitor app gebruikt (iOS of Android).
 *
 * Apple's App Store en Google Play Store nemen 15-30% commissie op in-app
 * aankopen van digitale goederen (credits, subscriptions). Daarom routeren
 * we die aankopen in de native app altijd naar de webversie.
 *
 * Fysieke goederen (shop, vinyl/CD verkoop) vallen NIET onder deze regels en
 * mogen wel via Stripe in-app betaald worden.
 */
export const useIsNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  // Capacitor v3+: isNativePlatform() bestaat. Fallback op getPlatform() voor oudere.
  if (typeof cap.isNativePlatform === 'function') {
    return cap.isNativePlatform();
  }
  if (typeof cap.getPlatform === 'function') {
    const p = cap.getPlatform();
    return p === 'ios' || p === 'android';
  }
  return false;
};
