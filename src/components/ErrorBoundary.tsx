import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Enhanced logging for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Stack:', error.stack);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.groupEnd();

    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto max-w-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Er is iets misgegaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              We hebben een onverwachte fout tegengekomen. Probeer het opnieuw of ga terug naar de homepage.
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Technische details
                </summary>
                <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
                  <div className="text-destructive font-bold mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {this.state.error.stack}
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={this.handleRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Probeer opnieuw
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Naar homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // Log error to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Handler');
      console.error('Error:', error);
      if (errorInfo) console.error('Info:', errorInfo);
      console.groupEnd();
    }
  }, []);

  return handleError;
};

// Specific error fallbacks
export const CollectionErrorFallback = ({ onRetry }: { onRetry?: () => void }) => (
  <Card className="p-8 text-center animate-fade-in">
    <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">Collectie kan niet geladen worden</h3>
    <p className="text-muted-foreground mb-4">
      Er is een probleem opgetreden bij het laden van je collectie.
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
        <RefreshCw className="w-4 h-4" />
        Opnieuw proberen
      </Button>
    )}
  </Card>
);

export const ScanErrorFallback = ({ onRetry }: { onRetry?: () => void }) => (
  <Card className="p-8 text-center animate-fade-in">
    <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">Scan mislukt</h3>
    <p className="text-muted-foreground mb-4">
      De analyse kon niet worden voltooid. Controleer je internetverbinding en probeer opnieuw.
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
        <RefreshCw className="w-4 h-4" />
        Opnieuw scannen
      </Button>
    )}
  </Card>
);