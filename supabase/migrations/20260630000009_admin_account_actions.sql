-- Admin-only account management helpers.

CREATE OR REPLACE FUNCTION public.assert_is_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  is_admin boolean,
  created_at timestamptz,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_is_admin();

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.is_admin,
    p.created_at,
    u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_force_breach(
  p_account_id uuid,
  p_reason text DEFAULT 'Force breached by administrator'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.trading_accounts%ROWTYPE;
  v_reason text := coalesce(nullif(trim(p_reason), ''), 'Force breached by administrator');
BEGIN
  PERFORM public.assert_is_admin();

  SELECT * INTO v_account
  FROM public.trading_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  UPDATE public.trading_accounts
  SET
    status = 'breached'::public.account_status,
    breached_at = now(),
    breach_reason = v_reason
  WHERE id = p_account_id;

  INSERT INTO public.ledger_entries (
    account_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_account_id,
    'breach'::public.ledger_type,
    0,
    v_account.cash_balance,
    jsonb_build_object(
      'reason', v_reason,
      'admin_action', true,
      'admin_id', auth.uid()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id,
    'status', 'breached',
    'breach_reason', v_reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_balance(p_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.trading_accounts%ROWTYPE;
  v_previous_balance numeric(15,2);
  v_adjustment numeric(15,2);
BEGIN
  PERFORM public.assert_is_admin();

  SELECT * INTO v_account
  FROM public.trading_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  v_previous_balance := v_account.cash_balance;
  v_adjustment := v_account.starting_balance - v_previous_balance;

  UPDATE public.trading_accounts
  SET
    cash_balance = starting_balance,
    status = 'active'::public.account_status,
    breached_at = NULL,
    breach_reason = NULL
  WHERE id = p_account_id;

  DELETE FROM public.account_daily_stats
  WHERE account_id = p_account_id;

  INSERT INTO public.ledger_entries (
    account_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_account_id,
    'initial_funding'::public.ledger_type,
    v_adjustment,
    v_account.starting_balance,
    jsonb_build_object(
      'admin_action', 'reset_balance',
      'admin_id', auth.uid(),
      'previous_balance', v_previous_balance
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id,
    'cash_balance', v_account.starting_balance,
    'status', 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_trades(p_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.trading_accounts%ROWTYPE;
  v_deleted_positions integer;
BEGIN
  PERFORM public.assert_is_admin();

  SELECT * INTO v_account
  FROM public.trading_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  DELETE FROM public.positions
  WHERE account_id = p_account_id;

  GET DIAGNOSTICS v_deleted_positions = ROW_COUNT;

  DELETE FROM public.ledger_entries
  WHERE account_id = p_account_id;

  DELETE FROM public.account_daily_stats
  WHERE account_id = p_account_id;

  UPDATE public.trading_accounts
  SET
    cash_balance = starting_balance,
    status = 'active'::public.account_status,
    breached_at = NULL,
    breach_reason = NULL
  WHERE id = p_account_id;

  INSERT INTO public.ledger_entries (
    account_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_account_id,
    'initial_funding'::public.ledger_type,
    v_account.starting_balance,
    v_account.starting_balance,
    jsonb_build_object(
      'admin_action', 'clear_trades',
      'admin_id', auth.uid(),
      'positions_deleted', v_deleted_positions
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id,
    'positions_deleted', v_deleted_positions,
    'cash_balance', v_account.starting_balance,
    'status', 'active'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_breach(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_trades(uuid) TO authenticated;
