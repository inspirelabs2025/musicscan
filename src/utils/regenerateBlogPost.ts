import { supabase } from '@/integrations/supabase/client';

export async function regenerateBlogPost(albumId: string, albumType: 'cd' | 'vinyl', forceRegenerate = false) {
  try {
    console.log('Regenerating blog post for:', { albumId, albumType, forceRegenerate });
    
    const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
      body: {
        albumId,
        albumType,
        forceRegenerate
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

// Function to batch regenerate blog posts (can be called manually when needed)
export async function batchRegenerateBlogPosts() {
  const blogPostsToRegenerate = [
    { id: '48903ef6-4bb1-4912-a332-f07c75de74dc', type: 'cd', name: 'Jimi Hendrix - Gangster of Love' },
    { id: 'f4c04c2d-36c0-4f72-b39c-4cf52b164d43', type: 'cd', name: 'Herman Grimme - Salad Days' },
    { id: '024dcf2a-59b5-4943-a24b-ed120b52cd72', type: 'cd', name: 'Van Morrison - The Best Of Van Morrison' }
  ];

  try {
    await Promise.all(
      blogPostsToRegenerate.map(async (post) => {
        try {
          console.log(`Regenerating ${post.name}...`);
          const result = await regenerateBlogPost(post.id, post.type as 'cd' | 'vinyl', true);
          
          // Publish the blog post immediately after generation
          if (result?.id) {
            await supabase
              .from('blog_posts')
              .update({ 
                is_published: true,
                published_at: new Date().toISOString()
              })
              .eq('id', result.id);
            console.log(`${post.name} regenerated and published successfully`);
          } else {
            // Fallback: publish by album_id when id is not returned (e.g., duplicate slug scenario)
            await supabase
              .from('blog_posts')
              .update({ 
                is_published: true,
                published_at: new Date().toISOString()
              })
              .eq('album_id', post.id);
            console.log(`${post.name} published via album_id fallback`);
          }
          
          return result;
        } catch (error) {
          console.error(`Failed to regenerate ${post.name}:`, error);
          throw error;
        }
      })
    );
    
    console.log('All blog posts updated with new 8-section structure and published');
  } catch (error) {
    console.error('Failed to update blog posts:', error);
    throw error;
  }
}