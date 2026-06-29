import { supabase } from "../lib/supabase";
import type { WorldCupOutcome } from "../types";

interface RegisterMarketParams {
  eventSlug: string;
  eventTitle: string;
  eventEndDate: string;
  outcome: WorldCupOutcome;
}

export async function registerMarketForOutcome({
  eventSlug,
  eventTitle,
  eventEndDate,
  outcome,
}: RegisterMarketParams): Promise<void> {
  const yesPrice = outcome.price;
  const noPrice = Math.max(0, Math.min(1, 1 - yesPrice));

  const { error } = await supabase.rpc("register_market", {
    p_polymarket_id: outcome.id,
    p_event_slug: eventSlug,
    p_slug: outcome.id,
    p_question: eventTitle,
    p_group_title: outcome.title,
    p_yes_price: yesPrice,
    p_no_price: noPrice,
    p_end_date: eventEndDate,
    p_closed: false,
    p_outcomes: {
      tokenIds: [outcome.clobTokenId],
      prices: [yesPrice, noPrice],
    },
  });

  if (error) throw error;
}

interface PlaceBetParams extends RegisterMarketParams {
  side: "yes" | "no";
  amount: number;
}

export async function placeBetOnOutcome({
  side,
  amount,
  ...registerParams
}: PlaceBetParams) {
  await registerMarketForOutcome(registerParams);

  const { data, error } = await supabase.rpc("place_bet", {
    p_market_id: registerParams.outcome.id,
    p_side: side,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}
