CREATE OR REPLACE FUNCTION public.trading_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Inventory (Discogs listings) incl. latest market signal
CREATE TABLE public.trading_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id bigint NOT NULL,
  release_id bigint NOT NULL,
  artist text,
  title text,
  thumb text,
  format text,
  condition text,
  sleeve_condition text,
  price numeric,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'For Sale',
  listing_uri text,
  posted_at timestamptz,
  market_price numeric,
  lowest_price numeric,
  num_for_sale integer,
  prev_num_for_sale integer,
  deviation_pct numeric,
  signal text DEFAULT 'unknown',
  market_checked_at timestamptz,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_inventory_items TO authenticated;
GRANT ALL ON public.trading_inventory_items TO service_role;
ALTER TABLE public.trading_inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own inventory" ON public.trading_inventory_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_trading_inv_release ON public.trading_inventory_items(release_id);
CREATE INDEX idx_trading_inv_user ON public.trading_inventory_items(user_id);
CREATE TRIGGER trg_trading_inv_updated BEFORE UPDATE ON public.trading_inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.trading_set_updated_at();

-- Wantlist
CREATE TABLE public.trading_wantlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  release_id bigint NOT NULL,
  artist text,
  title text,
  thumb text,
  year integer,
  added_at timestamptz,
  lowest_price numeric,
  num_for_sale integer,
  prev_num_for_sale integer,
  currency text DEFAULT 'EUR',
  market_checked_at timestamptz,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, release_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_wantlist_items TO authenticated;
GRANT ALL ON public.trading_wantlist_items TO service_role;
ALTER TABLE public.trading_wantlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wantlist" ON public.trading_wantlist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_trading_want_release ON public.trading_wantlist_items(release_id);
CREATE TRIGGER trg_trading_want_updated BEFORE UPDATE ON public.trading_wantlist_items
  FOR EACH ROW EXECUTE FUNCTION public.trading_set_updated_at();

-- Hourly market snapshots (chart source)
CREATE TABLE public.trading_price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id bigint NOT NULL,
  condition text NOT NULL DEFAULT 'all',
  suggested_price numeric,
  lowest_price numeric,
  num_for_sale integer,
  currency text DEFAULT 'EUR',
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trading_price_snapshots TO authenticated;
GRANT ALL ON public.trading_price_snapshots TO service_role;
ALTER TABLE public.trading_price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read market snapshots" ON public.trading_price_snapshots FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_trading_snap_release_time ON public.trading_price_snapshots(release_id, captured_at DESC);

-- Auto price rules
CREATE TABLE public.trading_auto_price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL UNIQUE REFERENCES public.trading_inventory_items(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  strategy text NOT NULL DEFAULT 'undercut_lowest',
  undercut_amount numeric NOT NULL DEFAULT 0.50,
  offset_pct numeric NOT NULL DEFAULT 0,
  min_price numeric NOT NULL,
  max_price numeric,
  last_applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_auto_price_rules TO authenticated;
GRANT ALL ON public.trading_auto_price_rules TO service_role;
ALTER TABLE public.trading_auto_price_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own auto price rules" ON public.trading_auto_price_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_trading_rules_updated BEFORE UPDATE ON public.trading_auto_price_rules
  FOR EACH ROW EXECUTE FUNCTION public.trading_set_updated_at();

-- Auto price log
CREATE TABLE public.trading_price_adjustments_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid REFERENCES public.trading_inventory_items(id) ON DELETE SET NULL,
  listing_id bigint NOT NULL,
  old_price numeric,
  new_price numeric,
  strategy text,
  status text NOT NULL DEFAULT 'applied',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trading_price_adjustments_log TO authenticated;
GRANT ALL ON public.trading_price_adjustments_log TO service_role;
ALTER TABLE public.trading_price_adjustments_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own price adjustments" ON public.trading_price_adjustments_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_trading_adj_user ON public.trading_price_adjustments_log(user_id, created_at DESC);

-- Alerts feed
CREATE TABLE public.trading_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  release_id bigint,
  related_user_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  pushed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
GRANT SELECT, UPDATE, DELETE ON public.trading_alerts TO authenticated;
GRANT ALL ON public.trading_alerts TO service_role;
ALTER TABLE public.trading_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own alerts" ON public.trading_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own alerts" ON public.trading_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own alerts" ON public.trading_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_trading_alerts_user ON public.trading_alerts(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_alerts;

-- Preferences
CREATE TABLE public.trading_alert_preferences (
  user_id uuid PRIMARY KEY,
  enabled_types text[] NOT NULL DEFAULT ARRAY['overpriced','underpriced','market_listing','wishlist_match','wantlist_available','discogs_news'],
  sound_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  threshold_pct numeric NOT NULL DEFAULT 10,
  share_wantlist boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_alert_preferences TO authenticated;
GRANT ALL ON public.trading_alert_preferences TO service_role;
ALTER TABLE public.trading_alert_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own alert preferences" ON public.trading_alert_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_trading_prefs_updated BEFORE UPDATE ON public.trading_alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.trading_set_updated_at();

-- Push devices
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own push devices" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);

-- Job runs (admin monitor)
CREATE TABLE public.trading_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  users_processed integer NOT NULL DEFAULT 0,
  items_processed integer NOT NULL DEFAULT 0,
  alerts_created integer NOT NULL DEFAULT 0,
  error text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.trading_job_runs TO authenticated;
GRANT ALL ON public.trading_job_runs TO service_role;
ALTER TABLE public.trading_job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read job runs" ON public.trading_job_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_trading_job_runs ON public.trading_job_runs(job, started_at DESC);