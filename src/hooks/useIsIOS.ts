/**
 * Detecteert of de gebruiker op een iOS-apparaat zit (iPhone/iPad).
 * Apple's App Store regels verbieden het aanbieden van directe betalingen
 * voor digitale goederen in apps. Gebruikers worden doorverwezen naar de website.
 */
export const useIsIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};
