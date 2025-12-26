-- Migration: create app_state table for small global key/value state
CREATE TABLE IF NOT EXISTS public.app_state (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

-- initialize guards_on_duty if missing
INSERT INTO public.app_state (key, value)
VALUES ('guards_on_duty', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
