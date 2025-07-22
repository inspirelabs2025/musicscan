import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const DiscogsTokenTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testToken = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔍 Testing Discogs token...');
      
      const { data, error } = await supabase.functions.invoke('test-discogs-token');

      if (error) {
        console.error('❌ Token test error:', error);
        setError(error.message || 'Er is een fout opgetreden');
        return;
      }

      console.log('✅ Token test result:', data);
      setResult(data);
      
    } catch (error) {
      console.error('❌ Token test failed:', error);
      setError(error.message || 'Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="dark" className="w-full max-w-2xl mx-auto">\
      <CardHeader>
        <CardTitle>🔑 Discogs Token Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testToken} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Token...
            </>
          ) : (
            'Test Nieuwe Discogs Token'
          )}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800">Error:</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Test Result:</h4>
              <ul className="mt-2 space-y-1 text-green-700">
                <li>✅ Token Present: {result.tokenPresent ? 'Yes' : 'No'}</li>
                <li>✅ API Working: {result.apiWorking ? 'Yes' : 'No'}</li>
                <li>✅ Success: {result.success ? 'Yes' : 'No'}</li>
              </ul>
            </div>
            
            {result.sampleData && (
              <details className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <summary className="font-semibold cursor-pointer">Sample API Response</summary>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result.sampleData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};