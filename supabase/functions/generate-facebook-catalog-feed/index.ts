import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  slug: string;
  artist: string;
  title: string;
  description: string | null;
  price: number;
  main_image_url: string;
  media_type: string;
  categories: string[];
  tags: string[];
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🛒 Generating Facebook Catalog Feed...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all active published products
    const { data: products, error } = await supabaseClient
      .from('platform_products')
      .select('*')
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      // Return empty CSV with headers instead of JSON error
      const emptyCSV = generateFacebookCSV([]);
      return new Response(emptyCSV, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
        },
      });
    }

    console.log(`✅ Found ${products?.length || 0} active products`);

    // Generate CSV feed (even if empty)
    const csv = generateFacebookCSV(products || []);

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating feed:', error);
    // Return empty CSV with headers on error instead of JSON
    const emptyCSV = generateFacebookCSV([]);
    return new Response(emptyCSV, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  }
});

function generateFacebookCSV(products: Product[]): string {
  // Facebook required fields header
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'google_product_category',
    'product_type',
    'item_group_id',
    'additional_image_link'
  ];

  const rows = products.map(product => {
    const category = getGoogleProductCategory(product);
    const productType = getProductType(product);
    const baseUrl = 'https://musicscan.app';
    
    return [
      escapeCSV(product.id),
      escapeCSV(`${product.artist} - ${product.title}`),
      escapeCSV(product.description || `${product.artist} - ${product.title}`),
      'in stock',
      'new',
      `${product.price.toFixed(2)} EUR`,
      `${baseUrl}/product/${product.slug}`,
      product.main_image_url,
      'MusicScan',
      category,
      productType,
      product.slug, // Group products by slug for variants
      '' // Additional images could be added here
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

function getGoogleProductCategory(product: Product): string {
  const categories = product.categories || [];
  const tags = product.tags || [];
  const mediaType = product.media_type?.toLowerCase() || '';

  // Art products
  if (categories.includes('ART') || categories.includes('CANVAS') || 
      tags.includes('poster') || tags.includes('canvas') || tags.includes('metal-print')) {
    return 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts';
  }

  // Merchandise (T-shirts, Socks, Buttons)
  if (categories.includes('MERCHANDISE') || 
      tags.includes('tshirts') || tags.includes('socks') || tags.includes('buttons')) {
    return 'Apparel & Accessories > Clothing';
  }

  // Music media (Vinyl, CD)
  if (mediaType === 'vinyl' || mediaType === 'cd' || tags.includes('vinyl') || tags.includes('cd')) {
    return 'Media > Music & Sound Recordings';
  }

  // Default
  return 'Arts & Entertainment';
}

function getProductType(product: Product): string {
  const categories = product.categories || [];
  const tags = product.tags || [];

  if (tags.includes('poster')) return 'Art > Posters';
  if (tags.includes('canvas')) return 'Art > Canvas Prints';
  if (tags.includes('metal-print')) return 'Art > Metal Prints';
  if (tags.includes('tshirts')) return 'Merchandise > T-Shirts';
  if (tags.includes('socks')) return 'Merchandise > Socks';
  if (tags.includes('buttons')) return 'Merchandise > Buttons';
  if (categories.includes('VINYL')) return 'Music > Vinyl Records';
  if (categories.includes('CD')) return 'Music > CDs';

  return 'Music Merchandise';
}

function escapeCSV(value: string | null): string {
  if (!value) return '';
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  
  return needsQuotes ? `"${escaped}"` : escaped;
}
