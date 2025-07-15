import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  connection: 'slow' | 'fast' | 'unknown';
  screenSize: 'small' | 'medium' | 'large';
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    connection: 'unknown',
    screenSize: 'large'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      
      // Device detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (width >= 768 && width <= 1024);
      const isDesktop = !isMobile && !isTablet;
      
      // Connection detection
      let connection: 'slow' | 'fast' | 'unknown' = 'unknown';
      if ('connection' in navigator && (navigator as any).connection) {
        const conn = (navigator as any).connection;
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          connection = 'slow';
        } else if (conn.effectiveType === '3g' || conn.effectiveType === '4g') {
          connection = 'fast';
        }
      }
      
      // Screen size detection
      let screenSize: 'small' | 'medium' | 'large' = 'large';
      if (width < 768) {
        screenSize = 'small';
      } else if (width < 1024) {
        screenSize = 'medium';
      }
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        connection,
        screenSize
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return detection;
};