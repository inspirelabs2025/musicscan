/**
 * Opens payment URLs in the system browser (not in-app WebView)
 * for Apple/Google app store compliance.
 */
export const openExternalPayment = async (url: string) => {
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  }

  // Try opening in a new tab first; fall back to same-tab redirect
  // when the popup is blocked (common after async awaits).
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    window.location.href = url;
  }
};
