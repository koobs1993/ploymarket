import { supabase } from "../lib/supabase";
import { secondaryMarketSlugs } from "../data/landingContent";
import { buildApiUrl } from "../api";

export async function syncMarkets(): Promise<{ success: boolean; count: number; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    try {
      const response = await fetch("/.netlify/functions/sync-markets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const payload = await response.json();

      if (response.ok && payload.success) {
        return { success: true, count: payload.count ?? 0 };
      }

      if (response.status !== 500 || !payload.error?.includes("configuration")) {
        return {
          success: false,
          count: 0,
          error: payload.error || `Sync failed (${response.status})`,
        };
      }
    } catch {
      // Fall through to direct sync in dev when function is unavailable.
    }
  }

  const slugs = ["world-cup-winner", ...secondaryMarketSlugs];
  let count = 0;

  try {
    for (const slug of slugs) {
      const params = new URLSearchParams({
        slug,
        active: "true",
      });
      const url = buildApiUrl("gamma", "events", params);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event ${slug}: ${response.status}`);
      }

      const events = await response.json();
      const event = events[0];
      if (!event || !event.markets) continue;

      for (const m of event.markets) {
        let prices = [0.5, 0.5];
        let tokenIds = ["", ""];
        try {
          if (m.outcomePrices) {
            prices = JSON.parse(m.outcomePrices).map(
              (p: string) => parseFloat(p) || 0,
            );
          }
          if (m.clobTokenIds) {
            tokenIds = JSON.parse(m.clobTokenIds);
          }
        } catch {
          // ignore parsing error
        }

        const yesPrice = prices[0] !== undefined ? prices[0] : 0.5;
        const noPrice = prices[1] !== undefined ? prices[1] : 1 - yesPrice;

        const { error } = await supabase.rpc("register_market", {
          p_polymarket_id: m.id,
          p_event_slug: slug,
          p_slug: m.slug || "",
          p_question: m.question || "",
          p_group_title: m.groupItemTitle || null,
          p_yes_price: yesPrice,
          p_no_price: noPrice,
          p_end_date: m.endDate || event.endDate || new Date().toISOString(),
          p_closed: m.closed || false,
          p_outcomes: { tokenIds, prices },
        });

        if (error) {
          console.error(`Error registering market for ${slug}:`, error);
          throw error;
        }
        count += 1;
      }
    }

    return { success: true, count };
  } catch (err) {
    console.error("Sync error:", err);
    return {
      success: false,
      count,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function settleMarkets(): Promise<{ success: boolean; settledCount: number; error?: string }> {
  let settledCount = 0;
  try {
    const { data: openMarkets, error: marketsError } = await supabase
      .from("markets")
      .select("*")
      .eq("closed", false);

    if (marketsError) throw marketsError;
    if (!openMarkets || openMarkets.length === 0) {
      return { success: true, settledCount: 0 };
    }

    for (const market of openMarkets) {
      const url = `${import.meta.env.DEV ? "https://gamma-api.polymarket.com" : "/.netlify/functions/polymarket?service=gamma&path="}markets/${market.polymarket_id}`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch state for market ${market.polymarket_id}`);
        continue;
      }

      const m = await response.json();
      if (
        m &&
        m.closed &&
        (m.umaResolutionStatus === "settled_normal" ||
          m.umaResolutionStatus === "voided")
      ) {
        let winningSide: "yes" | "no" | "void" = "void";

        if (m.umaResolutionStatus === "settled_normal" && m.outcomePrices) {
          const prices = JSON.parse(m.outcomePrices).map(
            (p: string) => parseFloat(p) || 0,
          );
          if (prices[0] >= 0.99) {
            winningSide = "yes";
          } else if (prices[1] >= 0.99) {
            winningSide = "no";
          }
        }

        const { data, error: rpcError } = await supabase.rpc(
          "settle_positions_for_market",
          {
            p_market_id: market.polymarket_id,
            p_winning_side: winningSide,
          },
        );

        if (rpcError) {
          console.error(
            `Error settling positions for market ${market.polymarket_id}:`,
            rpcError,
          );
        } else {
          settledCount += data?.positions_settled || 0;
        }
      }
    }

    return { success: true, settledCount };
  } catch (err) {
    console.error("Settle error:", err);
    return {
      success: false,
      settledCount,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
