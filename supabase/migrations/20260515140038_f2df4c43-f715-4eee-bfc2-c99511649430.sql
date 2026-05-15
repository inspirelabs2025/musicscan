CREATE TABLE IF NOT EXISTS public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  price_label text NOT NULL,
  per_credit_label text NOT NULL,
  badge text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit packages"
  ON public.credit_packages FOR SELECT
  USING (active = true);

CREATE TRIGGER update_credit_packages_updated_at
BEFORE UPDATE ON public.credit_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.credit_packages (stripe_price_id, credits, price_label, per_credit_label, badge, sort_order) VALUES
  ('price_1TWft6IHZHcZHyKVYrZoAW6P', 10,   '€2,95',  '€0,30',  NULL,           1),
  ('price_1TWftQIHZHcZHyKVT2yNX3TP', 50,   '€9,95',  '€0,20',  NULL,           2),
  ('price_1TWfu2IHZHcZHyKVUYQ3tPe4', 100,  '€14,95', '€0,15',  'Populairste',  3),
  ('price_1TWfubIHZHcZHyKVrkM237tC', 250,  '€29,95', '€0,12',  NULL,           4),
  ('price_1TWfvHIHZHcZHyKVT1ztzUjR', 500,  '€49,95', '€0,10',  NULL,           5),
  ('price_1TWfvaIHZHcZHyKVeUAkKvQj', 1000, '€79,95', '€0,08',  'Beste Deal',   6)
ON CONFLICT (stripe_price_id) DO NOTHING;