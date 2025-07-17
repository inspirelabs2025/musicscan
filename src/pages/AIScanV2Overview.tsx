import React from 'react';
import { Brain, Sparkles, Clock, TrendingUp, Zap, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { useAIScans } from '@/hooks/useAIScans';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AIScanV2Overview() {
  const { data, isLoading, error } = useAIScans();
  const scans = data?.data || [];

  // Filter for V2 scans
  const v2Scans = scans.filter(scan => 
    scan.analysis_data && 
    typeof scan.analysis_data === 'object' && 
    'version' in scan.analysis_data && 
    scan.analysis_data.version === 'v2'
  );

  const stats = {
    total: v2Scans.length,
    completed: v2Scans.filter(scan => scan.status === 'completed').length,
    highConfidence: v2Scans.filter(scan => (scan.confidence_score || 0) > 0.8).length,
    avgConfidence: v2Scans.length > 0 
      ? Math.round((v2Scans.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0) / v2Scans.length) * 100)
      : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="outline">Onbekend</Badge>;
    
    const percentage = Math.round(confidence * 100);
    if (percentage > 80) return <Badge variant="default">{percentage}%</Badge>;
    if (percentage > 50) return <Badge variant="secondary">{percentage}%</Badge>;
    return <Badge variant="destructive">{percentage}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Navigation />
          </div>
        </header>
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <Clock className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Laden...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Navigation />
          </div>
        </header>
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <p className="text-red-600">Error: {error?.message || 'Er is een fout opgetreden'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Navigation />
        </div>
      </header>

      <div className="p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <Brain className="h-8 w-8" />
              <Sparkles className="h-6 w-6 text-yellow-500" />
              AI Scan V2 Overzicht
              <Badge variant="secondary" className="ml-2">BETA</Badge>
            </h1>
            <p className="text-muted-foreground">
              Verbeterde AI-analyse resultaten met GPT-4.1 en multi-pass analyse
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Totaal V2 Scans</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Voltooid</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Hoog Vertrouwen</p>
                    <p className="text-2xl font-bold">{stats.highConfidence}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Gem. Vertrouwen</p>
                    <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent V2 Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recente V2 AI Scans
                <Badge variant="outline">{v2Scans.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {v2Scans.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nog geen V2 AI scans uitgevoerd.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start je eerste V2 analyse om de verbeterde resultaten te zien.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {v2Scans
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {scan.artist && scan.title 
                                ? `${scan.artist} - ${scan.title}`
                                : scan.artist || scan.title || 'Onbekende release'
                              }
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              V2
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="capitalize">{scan.media_type}</span>
                            <span>{scan.condition_grade}</span>
                            <span>{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true, locale: nl })}</span>
                          </div>
                          
                          {scan.label && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Label: {scan.label}
                              {scan.catalog_number && ` • ${scan.catalog_number}`}
                              {scan.year && ` • ${scan.year}`}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {getConfidenceBadge(scan.confidence_score)}
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(scan.status)}
                          >
                            {scan.status}
                          </Badge>
                          
                          {scan.discogs_url && (
                            <a
                              href={scan.discogs_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-sm"
                            >
                              Discogs →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* V2 Features Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                V2 Verbeteringen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Technische Verbeteringen</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• GPT-4.1-2025-04-14 model</li>
                    <li>• JSON structured output</li>
                    <li>• Multi-pass analyse</li>
                    <li>• Verbeterde tekst extractie</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Betere Resultaten</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Hogere match accuraatheid</li>
                    <li>• Geavanceerde Discogs zoekstrategie</li>
                    <li>• Betere confidence scoring</li>
                    <li>• Media-specifieke prompts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}