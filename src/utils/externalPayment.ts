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

  // On web (non-native) redirect in the same tab. Opening a new tab via
  // window.open() after an async await is unreliable: popup blockers cancel
  // it, and inside iframes (like the Lovable preview) it often returns a
  // non-null blank window that never navigates — so the buy button looks
  // like it does nothing. App-store compliance only requires the external
  // browser on native platforms, which is handled above.
  window.location.href = url;
};
