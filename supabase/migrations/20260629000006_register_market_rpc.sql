-- Allows authenticated users to register/update market prices before placing bets.
-- Fixes 403 when client tried to upsert markets directly (admin-only RLS).

CREATE OR REPLACE FUNCTION public.register_market(
  p_polymarket_id text,
  p_event_slug text,
  p_slug text,
  p_question text,
  p_group_title text,
  p_yes_price numeric,
  p_no_price numeric,
  p_end_date timestamptz,
  p_closed boolean DEFAULT false,
  p_outcomes jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.markets (
    polymarket_id,
    event_slug,
    slug,
    question,
    group_title,
    outcomes,
    yes_price,
    no_price,
    end_date,
    closed,
    last_synced_at
  ) VALUES (
    p_polymarket_id,
    p_event_slug,
    p_slug,
    p_question,
    p_group_title,
    p_outcomes,
    p_yes_price,
    p_no_price,
    p_end_date,
    p_closed,
    now()
  )
  ON CONFLICT (polymarket_id) DO UPDATE SET
    yes_price = EXCLUDED.yes_price,
    no_price = EXCLUDED.no_price,
    closed = EXCLUDED.closed,
    outcomes = EXCLUDED.outcomes,
    last_synced_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_market TO authenticated;
