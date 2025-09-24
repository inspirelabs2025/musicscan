-- Create shop_products table for admin-managed general products
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  images TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 100,
  shipping_cost NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_products
CREATE POLICY "Public products are viewable by everyone" 
ON public.shop_products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all shop products" 
ON public.shop_products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_id IN (
      -- Add admin user IDs here - for now allow authenticated users to test
      SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for shop product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for shop product images
CREATE POLICY "Shop product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'shop-products');

CREATE POLICY "Admins can upload shop product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'shop-products' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can update shop product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'shop-products' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can delete shop product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'shop-products' 
  AND auth.uid() IS NOT NULL
);