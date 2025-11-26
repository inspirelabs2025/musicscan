import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LlmSitemap = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set content type header for XML
    document.querySelector('meta[http-equiv="Content-Type"]')?.remove();
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Type';
    meta.content = 'application/xml; charset=utf-8';
    document.head.appendChild(meta);

    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-llm-sitemap');
        
        if (error) {
          console.error('Error fetching LLM sitemap:', error);
          setContent('<?xml version="1.0" encoding="UTF-8"?>\n<error>Error loading sitemap</error>');
        } else {
          setContent(data || '<?xml version="1.0" encoding="UTF-8"?>\n<error>No data</error>');
        }
      } catch (err) {
        console.error('Exception fetching LLM sitemap:', err);
        setContent('<?xml version="1.0" encoding="UTF-8"?>\n<error>Error loading sitemap</error>');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return <div>Loading sitemap...</div>;
  }

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      padding: '20px',
      margin: 0,
      fontSize: '12px'
    }}>
      {content}
    </pre>
  );
};

export default LlmSitemap;
