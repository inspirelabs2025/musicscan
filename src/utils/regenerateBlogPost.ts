import { supabase } from '@/integrations/supabase/client';

export async function regenerateBlogPost(albumId: string, albumType: 'cd' | 'vinyl') {
  try {
    console.log('Regenerating blog post for:', { albumId, albumType });
    
    const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
      body: {
        albumId,
        albumType
      }
    });

    if (error) {
      console.error('Blog regeneration error:', error);
      throw error;
    }

    console.log('Blog regeneration successful:', data);
    return data;
  } catch (error) {
    console.error('Error regenerating blog:', error);
    throw error;
  }
}

// Regenerate Jimi Hendrix post immediately when this module loads
regenerateBlogPost('48903ef6-4bb1-4912-a332-f07c75de74dc', 'cd')
  .then(() => {
    console.log('Jimi Hendrix blog post updated with new 8-section structure');
  })
  .catch(error => {
    console.error('Failed to update Jimi Hendrix blog post:', error);
  });