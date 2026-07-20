import { sendGAEvent } from '@/hooks/useGoogleAnalytics';

export type ScanType = 'vinyl' | 'cd';
export type ScanResult = 'found' | 'not_found';

const genEventID = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());

/**
 * Track when a user initiates a scan
 */
export const trackScanStart = (scanType: ScanType) => {
  sendGAEvent('scan_start', {
    scan_type: scanType,
  });

  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'scan_start', { scan_type: scanType }, { eventID: genEventID() });
  }

  console.log('📊 GA4: scan_start', { scan_type: scanType });
};

/**
 * Track when a scan completes (success or no match)
 */
export const trackScanComplete = (scanType: ScanType, result: ScanResult) => {
  sendGAEvent('scan_complete', {
    scan_type: scanType,
    result,
  });

  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'scan_complete', { scan_type: scanType, result }, { eventID: genEventID() });
  }

  console.log('📊 GA4: scan_complete', { scan_type: scanType, result });
};
