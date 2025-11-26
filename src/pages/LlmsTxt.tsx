import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LlmsTxt = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('serve-llms-txt');
        
        if (error) {
          console.error('Error fetching llms.txt:', error);
          setContent('Error loading content');
        } else {
          setContent(data || '');
        }
      } catch (err) {
        console.error('Exception fetching llms.txt:', err);
        setContent('Error loading content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>Loading...</pre>;
  }

  return (
    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '20px' }}>
      {content}
    </pre>
  );
};

export default LlmsTxt;
