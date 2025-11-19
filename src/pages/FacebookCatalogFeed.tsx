import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function FacebookCatalogFeed() {
  const [feedData, setFeedData] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateFeed = async () => {
      try {
        console.log('📤 Fetching Facebook catalog feed...');
        
        const { data, error } = await supabase.functions.invoke(
          'generate-facebook-catalog-feed',
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (error) throw error;

        // Convert response to CSV text
        const csvText = typeof data === 'string' ? data : JSON.stringify(data);
        setFeedData(csvText);
        console.log('✅ Facebook catalog feed generated');
        
      } catch (error) {
        console.error('❌ Error generating feed:', error);
        setFeedData('Error generating feed');
      } finally {
        setLoading(false);
      }
    };

    generateFeed();
  }, []);

  // Return CSV as plain text
  if (loading) {
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        whiteSpace: 'pre-wrap'
      }}>
        Generating Facebook Catalog Feed...
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px',
      whiteSpace: 'pre-wrap'
    }}>
      {feedData}
    </div>
  );
}
