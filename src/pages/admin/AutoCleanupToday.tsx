import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AutoCleanupToday = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const executeCleanup = async () => {
      try {
        console.log('🗑️ Starting automatic cleanup of today\'s items...');
        
        const { data, error } = await supabase.functions.invoke('admin-bulk-cleanup-today', {
          body: { cleanup_mode: 'today' }
        });

        if (error) throw error;

        console.log('✅ Cleanup completed:', data);
        setResult(data);
        setStatus('success');
        
        // Redirect back after 3 seconds
        setTimeout(() => {
          navigate('/admin/bulk-art-generator');
        }, 3000);
      } catch (err: any) {
        console.error('❌ Cleanup failed:', err);
        setError(err.message || 'Unknown error');
        setStatus('error');
      }
    };

    executeCleanup();
  }, [navigate]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
            Automatische Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg">Bezig met verwijderen van alle items van vandaag...</p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Cleanup Voltooid</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded">
                    <div className="text-muted-foreground">Producten verwijderd</div>
                    <div className="text-2xl font-bold text-green-600">{result.products_deleted}</div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-muted-foreground">Blogs verwijderd</div>
                    <div className="text-2xl font-bold text-green-600">{result.blogs_deleted}</div>
                  </div>
                </div>
                {result.message && (
                  <p className="text-sm text-green-700 mt-4">{result.message}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Je wordt over 3 seconden teruggestuurd...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
              <h3 className="text-lg font-semibold text-destructive mb-2">❌ Cleanup Mislukt</h3>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoCleanupToday;
