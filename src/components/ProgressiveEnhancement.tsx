import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WifiOff, RefreshCw, Download, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show reconnection message
        console.log('🌐 Back online!');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator = ({ className }: OfflineIndicatorProps) => {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in ${className}`}>
      <Badge variant="destructive" className="flex items-center gap-2 px-3 py-2">
        <WifiOff className="w-4 h-4" />
        Offline - Beperkte functionaliteit
      </Badge>
    </div>
  );
};

interface OfflineCardProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const OfflineCard = ({ 
  title = "Geen internetverbinding",
  description = "Controleer je internetverbinding en probeer opnieuw.",
  onRetry,
  className
}: OfflineCardProps) => {
  return (
    <Card className={`max-w-md mx-auto animate-fade-in ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <WifiOff className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Opnieuw proberen
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Progressive enhancement component
interface ProgressiveEnhancementProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature: 'camera' | 'geolocation' | 'notifications' | 'serviceWorker';
}

export const ProgressiveEnhancement = ({ children, fallback, feature }: ProgressiveEnhancementProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeatureSupport = () => {
      let supported = false;
      
      switch (feature) {
        case 'camera':
          supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
          break;
        case 'geolocation':
          supported = !!navigator.geolocation;
          break;
        case 'notifications':
          supported = 'Notification' in window;
          break;
        case 'serviceWorker':
          supported = 'serviceWorker' in navigator;
          break;
      }
      
      setIsSupported(supported);
      setIsLoading(false);
    };

    checkFeatureSupport();
  }, [feature]);

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-8 rounded" />;
  }

  if (!isSupported && fallback) {
    return <>{fallback}</>;
  }

  return isSupported ? <>{children}</> : null;
};

// Cached data manager for offline support
export const useCachedData = <T,>(key: string, fetchFn: () => Promise<T>, ttl: number = 300000) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOfflineStatus();

  useEffect(() => {
    const loadData = async () => {
      try {
        const cached = localStorage.getItem(`cache_${key}`);
        const cacheTime = localStorage.getItem(`cache_time_${key}`);
        
        // Check if cached data is still valid
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < ttl) {
            setData(JSON.parse(cached));
            setIsLoading(false);
            return;
          }
        }
        
        // If online, fetch fresh data
        if (isOnline) {
          const freshData = await fetchFn();
          setData(freshData);
          
          // Cache the data
          localStorage.setItem(`cache_${key}`, JSON.stringify(freshData));
          localStorage.setItem(`cache_time_${key}`, Date.now().toString());
        } else if (cached) {
          // Use stale cache if offline
          setData(JSON.parse(cached));
        }
      } catch (err) {
        setError(err as Error);
        
        // Try to use stale cache on error
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
          setData(JSON.parse(cached));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, isOnline, fetchFn, ttl]);

  const refresh = async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(freshData));
      localStorage.setItem(`cache_time_${key}`, Date.now().toString());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refresh, isOnline };
};