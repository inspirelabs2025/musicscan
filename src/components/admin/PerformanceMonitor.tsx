import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebVitals } from "@/hooks/useWebVitals";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
  url: string;
}

export function PerformanceMonitor() {
  const { getVitalsReport, clearVitalsReport } = useWebVitals();
  const [metrics, setMetrics] = useState<VitalMetric[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const vitals = getVitalsReport();
    setMetrics(vitals);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClear = () => {
    clearVitalsReport();
    setMetrics([]);
  };

  const getMetricThresholds = (name: string) => {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      'LCP': { good: 2500, needsImprovement: 4000 },
      'CLS': { good: 0.1, needsImprovement: 0.25 },
      'FCP': { good: 1800, needsImprovement: 3000 },
      'TTFB': { good: 800, needsImprovement: 1800 },
      'INP': { good: 200, needsImprovement: 500 },
    };
    return thresholds[name] || { good: 100, needsImprovement: 300 };
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'good':
        return <Badge className="bg-green-500">Goed</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-yellow-500">Te verbeteren</Badge>;
      case 'poor':
        return <Badge className="bg-red-500">Slecht</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  const getMetricDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'LCP': 'Largest Contentful Paint - Tijd tot grootste element geladen is',
      'CLS': 'Cumulative Layout Shift - Visuele stabiliteit van de pagina',
      'FCP': 'First Contentful Paint - Tijd tot eerste content zichtbaar is',
      'TTFB': 'Time to First Byte - Server response tijd',
      'INP': 'Interaction to Next Paint - Interactie responsiviteit',
    };
    return descriptions[name] || name;
  };

  const calculateAverages = () => {
    const metricGroups = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(metricGroups).map(([name, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const thresholds = getMetricThresholds(name);
      const rating = avg <= thresholds.good ? 'good' : 
                     avg <= thresholds.needsImprovement ? 'needs-improvement' : 'poor';
      
      return { name, avg, rating, count: values.length };
    });
  };

  const averages = calculateAverages();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Core Web Vitals Overzicht
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ververs
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                Wis Data
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Performance metrics verzameld vanaf deze browser ({metrics.length} metingen)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {averages.map(({ name, avg, rating, count }) => (
              <Card key={name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{name}</CardTitle>
                  <CardDescription className="text-xs">
                    {getMetricDescription(name)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {name === 'CLS' ? avg.toFixed(3) : Math.round(avg)}
                      {name !== 'CLS' && 'ms'}
                    </div>
                    {getRatingBadge(rating)}
                    <p className="text-xs text-muted-foreground">
                      {count} metingen
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Aanbevelingen</CardTitle>
          <CardDescription>Tips om Core Web Vitals te verbeteren</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-medium mb-1">LCP (Largest Contentful Paint)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Optimaliseer afbeeldingen (WebP formaat, lazy loading)</li>
                <li>• Gebruik CDN voor snellere content levering</li>
                <li>• Preload kritieke resources</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-medium mb-1">FID/INP (Interactivity)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Minimaliseer JavaScript execution tijd</li>
                <li>• Code splitting en lazy loading</li>
                <li>• Gebruik Web Workers voor zware taken</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-medium mb-1">CLS (Cumulative Layout Shift)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reserveer ruimte voor afbeeldingen en ads</li>
                <li>• Gebruik font-display: swap voor web fonts</li>
                <li>• Vermijd content shifts tijdens laden</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h4 className="font-medium mb-1">TTFB (Time to First Byte)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Optimaliseer server response tijd</li>
                <li>• Gebruik server-side caching</li>
                <li>• Upgrade hosting als nodig</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente Metingen</CardTitle>
            <CardDescription>Laatste 10 performance metingen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.slice(-10).reverse().map((metric, index) => (
                <div
                  key={`${metric.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{metric.name}</span>
                      {getRatingBadge(metric.rating)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{metric.url}</span>
                      <span>•</span>
                      <span>{new Date(metric.timestamp).toLocaleTimeString('nl-NL')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)}
                      {metric.name !== 'CLS' && 'ms'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
