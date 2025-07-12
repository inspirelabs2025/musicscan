import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function DiscogsTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Starting Discogs API test...');
      
      const { data, error: supabaseError } = await supabase.functions.invoke('test-discogs');
      
      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }
      
      console.log('✅ Test completed:', data);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Test failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Discogs API Test</CardTitle>
        <p className="text-muted-foreground">
          Test de Discogs API met Gilbert Bécaud data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Run Discogs Test'}
        </Button>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h3 className="font-semibold text-destructive">Error:</h3>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold">Test Data:</h3>
              <pre className="text-sm mt-2 overflow-x-auto">
                {JSON.stringify(results.testData, null, 2)}
              </pre>
            </div>

            {results.authenticationTests?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Authentication Tests:</h3>
                {results.authenticationTests.map((test: any, index: number) => (
                  <div key={index} className={`p-4 border rounded-lg ${
                    test.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                  }`}>
                    <h4 className="font-medium flex items-center gap-2">
                      {test.success ? '✅' : '❌'} {test.method}
                    </h4>
                    <p className="text-sm">Status: {test.status}</p>
                    {test.error && <p className="text-sm text-red-600 dark:text-red-400">{test.error}</p>}
                  </div>
                ))}
              </div>
            )}

            {results.searchResults?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Search Results:</h3>
                {results.searchResults.map((result: any, index: number) => (
                  <div key={index} className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                    <h4 className="font-medium capitalize">{result.strategy.replace('_', ' ')}</h4>
                     <p className="text-sm text-muted-foreground">Query: {result.query}</p>
                     <p className="text-sm">Status: {result.status} | Results: {result.resultsCount}</p>
                     {result.authMethod && <p className="text-xs text-muted-foreground">Auth: {result.authMethod}</p>}
                    
                    {result.results?.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Found releases:</h5>
                        <ul className="text-sm space-y-1 mt-1">
                          {result.results.slice(0, 3).map((release: any, i: number) => (
                            <li key={i} className="pl-2 border-l-2 border-primary/20">
                              {release.title} ({release.year}) - {release.label?.[0] || 'Unknown Label'}
                              {release.catno && ` [${release.catno}]`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.errors?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">Errors:</h3>
                {results.errors.map((error: any, index: number) => (
                  <div key={index} className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <h4 className="font-medium capitalize">{error.strategy.replace('_', ' ')}</h4>
                    <p className="text-sm">Status: {error.status}</p>
                    <p className="text-sm text-destructive">{error.error}</p>
                  </div>
                ))}
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Raw Response</summary>
              <pre className="text-xs mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}