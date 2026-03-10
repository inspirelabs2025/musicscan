/**
 * Opens payment URLs in the system browser (not in-app WebView)
 * for Apple/Google app store compliance.
 */
export const openExternalPayment = async (url: string) => {
  if ((window as any).Capacitor) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};
