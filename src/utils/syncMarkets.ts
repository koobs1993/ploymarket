import { supabase } from "../lib/supabase";
import { secondaryMarketSlugs } from "../data/landingContent";
import { buildApiUrl } from "../api";

export async function syncMarkets(): Promise<{ success: boolean; count: number; error?: string }> {
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

      const marketsToUpsert = event.markets.map((m: any) => {
        let prices = [0.5, 0.5];
        let tokenIds = ["", ""];
        try {
          if (m.outcomePrices) {
            prices = JSON.parse(m.outcomePrices).map((p: string) => parseFloat(p) || 0);
          }
          if (m.clobTokenIds) {
            tokenIds = JSON.parse(m.clobTokenIds);
          }
        } catch (e) {
          // ignore parsing error
        }

        const yesPrice = prices[0] !== undefined ? prices[0] : 0.5;
        const noPrice = prices[1] !== undefined ? prices[1] : (1 - yesPrice);

        return {
          polymarket_id: m.id,
          event_slug: slug,
          slug: m.slug || "",
          question: m.question || "",
          group_title: m.groupItemTitle || null,
          outcomes: {
            tokenIds,
            prices,
          },
          yes_price: yesPrice,
          no_price: noPrice,
          end_date: m.endDate || event.endDate || new Date().toISOString(),
          closed: m.closed || false,
          uma_resolution_status: m.umaResolutionStatus || null,
          last_synced_at: new Date().toISOString(),
        };
      });

      if (marketsToUpsert.length > 0) {
        const { error } = await supabase
          .from("markets")
          .upsert(marketsToUpsert);

        if (error) {
          console.error(`Error upserting markets for ${slug}:`, error);
          throw error;
        }
        count += marketsToUpsert.length;
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
    // 1. Find markets in public.markets where closed = false (or we check open positions)
    // Actually, let's fetch active markets from Supabase
    const { data: openMarkets, error: marketsError } = await supabase
      .from("markets")
      .select("*")
      .eq("closed", false);

    if (marketsError) throw marketsError;
    if (!openMarkets || openMarkets.length === 0) {
      return { success: true, settledCount: 0 };
    }

    // 2. Query each open market's live state from Polymarket Gamma API to see if it is resolved
    for (const market of openMarkets) {
      // Gamma allows querying single market by id: GET /markets/:id
      const url = `${import.meta.env.DEV ? 'https://gamma-api.polymarket.com' : '/.netlify/functions/polymarket?service=gamma&path='}markets/${market.polymarket_id}`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch state for market ${market.polymarket_id}`);
        continue;
      }

      const m = await response.json();
      // A market is fully resolved if closed = true AND umaResolutionStatus is settled_normal or voided
      if (m && m.closed && (m.umaResolutionStatus === "settled_normal" || m.umaResolutionStatus === "voided")) {
        let winningSide: "yes" | "no" | "void" = "void";

        if (m.umaResolutionStatus === "settled_normal" && m.outcomePrices) {
          const prices = JSON.parse(m.outcomePrices).map((p: string) => parseFloat(p) || 0);
          // Yes is index 0, No is index 1
          if (prices[0] >= 0.99) {
            winningSide = "yes";
          } else if (prices[1] >= 0.99) {
            winningSide = "no";
          }
        }

        // Call the database function to settle positions for this market
        const { data, error: rpcError } = await supabase.rpc("settle_positions_for_market", {
          p_market_id: market.polymarket_id,
          p_winning_side: winningSide,
        });

        if (rpcError) {
          console.error(`Error settling positions for market ${market.polymarket_id}:`, rpcError);
        } else {
          settledCount += (data?.positions_settled || 0);
          console.log(`Successfully settled market ${market.polymarket_id}. Winning side: ${winningSide}. Positions settled: ${data?.positions_settled}`);
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
