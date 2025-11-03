import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

const reportWebVitals = async (metric: WebVitalsMetric) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Store web vitals in localStorage for analytics
    const vitals = JSON.parse(localStorage.getItem('web_vitals') || '[]');
    vitals.push({
      ...metric,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      user_id: user?.id || 'anonymous'
    });
    
    // Keep only last 100 measurements
    if (vitals.length > 100) {
      vitals.shift();
    }
    
    localStorage.setItem('web_vitals', JSON.stringify(vitals));
    
    console.log('Web Vital:', metric.name, metric.value, metric.rating);
  } catch (error) {
    console.error('Error reporting web vitals:', error);
  }
};

export const useWebVitals = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const observeWebVitals = async () => {
      try {
        // Dynamically import web-vitals to reduce bundle size
        const { onCLS, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');
        
        // Core Web Vitals
        onCLS(reportWebVitals);  // Cumulative Layout Shift
        onLCP(reportWebVitals);  // Largest Contentful Paint
        onINP(reportWebVitals);  // Interaction to Next Paint
        
        // Other useful metrics
        onFCP(reportWebVitals);  // First Contentful Paint
        onTTFB(reportWebVitals); // Time to First Byte
      } catch (error) {
        console.error('Error loading web-vitals:', error);
      }
    };

    observeWebVitals();
  }, []);

  const getVitalsReport = () => {
    const vitals = JSON.parse(localStorage.getItem('web_vitals') || '[]');
    return vitals;
  };

  const clearVitalsReport = () => {
    localStorage.removeItem('web_vitals');
  };

  return {
    getVitalsReport,
    clearVitalsReport
  };
};
