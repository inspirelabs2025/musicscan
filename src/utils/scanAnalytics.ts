import { sendGAEvent } from '@/hooks/useGoogleAnalytics';

export type ScanType = 'vinyl' | 'cd';
export type ScanResult = 'found' | 'not_found';

/**
 * Track when a user initiates a scan
 */
export const trackScanStart = (scanType: ScanType) => {
  sendGAEvent('scan_start', {
    scan_type: scanType,
  });

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

  console.log('📊 GA4: scan_complete', { scan_type: scanType, result });
};
