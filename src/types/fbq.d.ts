export {};

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[]; loaded?: boolean; version?: string };
    _fbq?: Window['fbq'];
  }
}
