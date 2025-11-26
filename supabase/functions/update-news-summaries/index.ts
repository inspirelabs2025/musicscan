import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const updates = [
      { id: '47d4329d-dc0c-4e98-8cb5-fddddd2f0704', description: 'De bezuinigingsgolf binnen de publieke omroep raakt nu ook NPO Klassiek en NPO Radio 5, na eerdere berichten over ingrepen bij NPO Radio 2.' },
      { id: '14b835d7-dbfc-4930-bc75-dc4996d260e3', description: 'Rob Stenders viert volgende week zijn veertigjarig jubileum als radiomaker met een extra feestelijke uitzending op Radio Veronica.' },
      { id: '9fa0fc7b-56a1-48c9-8358-6fe0f442b0d4', description: 'Qmusic heeft NPO Radio 2 ingehaald en is de nieuwe marktleider in de Nederlandse radiolandschap volgens de cijfers van week 47.' },
      { id: '00ffc9d0-a908-436b-afac-81295f7a0977', description: 'Cliff Richard kondigt exclusief concert aan in de Ziggo Dome op 17 mei 2014. De kaartverkoop start vandaag.' },
      { id: '1f54fedd-6e8b-4334-a342-da8b65bfc806', description: 'Rihanna is onbedoeld de aanleiding voor een derde arrestatie in Thailand na het delen van vakantiedetails op Twitter.' },
      { id: '64062370-cf6e-4c37-ade6-9887150351cb', description: 'Taylor Swift opent het Taylor Swift Education Center in Nashville, een unieke muzikale trekpleister in de bakermat van countrymuziek.' },
      { id: '0134e97f-4453-4f82-aa78-48e7f4fb85d3', description: 'Miss Montreal kondigt uitgebreide clubtournee aan die volgend voorjaar door Nederland zal trekken.' },
      { id: 'e6c2f043-8ac6-4ead-9c87-230ebc902956', description: 'Lady Gaga beantwoordt vragen van fans via Twitter en deelt persoonlijke voorkeuren en studio-inspiratie.' },
      { id: '1bced850-06a1-4fe2-ab27-849da86ec3b0', description: 'De Rock & Roll Hall of Fame maakt de lijst met genomineerden voor de volgende inductieklasse bekend.' },
      { id: '07f1a76f-12ec-4e50-86f5-eb833145ba5a', description: 'Prince organiseert uniek pyjamafeestje met intiem concert en zonsopgangoptreden voor zijn fans.' }
    ];

    let updated = 0;
    const results = [];

    for (const item of updates) {
      const { data: article } = await supabase
        .from('blog_posts')
        .select('yaml_frontmatter')
        .eq('id', item.id)
        .single();

      if (article) {
        const updatedFrontmatter = {
          ...article.yaml_frontmatter,
          description: item.description
        };

        const { error } = await supabase
          .from('blog_posts')
          .update({ yaml_frontmatter: updatedFrontmatter })
          .eq('id', item.id);

        if (!error) {
          updated++;
          results.push({ id: item.id, updated: true });
        } else {
          console.error(`Error updating ${item.id}:`, error);
          results.push({ id: item.id, error: error.message });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updated} out of ${updates.length} articles`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
