import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GAMMA_HOST = "https://gamma-api.polymarket.com";
const EVENT_SLUGS = [
  "world-cup-winner",
  "world-cup-golden-glove-winner-20260603195306910",
  "world-cup-nation-to-reach-final",
];

function gammaUrl(slug: string): string {
  const params = new URLSearchParams({ slug, active: "true" });
  return `${GAMMA_HOST}/events?${params.toString()}`;
}

async function syncAllMarkets(serviceClient: ReturnType<typeof createClient>) {
  let count = 0;

  for (const slug of EVENT_SLUGS) {
    const response = await fetch(gammaUrl(slug), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch event ${slug}: ${response.status}`);
    }

    const events = await response.json();
    const event = events[0];
    if (!event?.markets) continue;

    const marketsToUpsert = event.markets.map((m: Record<string, unknown>) => {
      let prices = [0.5, 0.5];
      let tokenIds = ["", ""];

      try {
        if (m.outcomePrices) {
          prices = JSON.parse(String(m.outcomePrices)).map(
            (p: string) => parseFloat(p) || 0,
          );
        }
        if (m.clobTokenIds) {
          tokenIds = JSON.parse(String(m.clobTokenIds));
        }
      } catch {
        // ignore parse errors
      }

      const yesPrice = prices[0] ?? 0.5;
      const noPrice = prices[1] ?? 1 - yesPrice;

      return {
        polymarket_id: m.id,
        event_slug: slug,
        slug: m.slug || "",
        question: m.question || "",
        group_title: m.groupItemTitle || null,
        outcomes: { tokenIds, prices },
        yes_price: yesPrice,
        no_price: noPrice,
        end_date: m.endDate || event.endDate || new Date().toISOString(),
        closed: m.closed || false,
        uma_resolution_status: m.umaResolutionStatus || null,
        last_synced_at: new Date().toISOString(),
      };
    });

    if (marketsToUpsert.length > 0) {
      const { error } = await serviceClient
        .from("markets")
        .upsert(marketsToUpsert);

      if (error) throw error;
      count += marketsToUpsert.length;
    }
  }

  return count;
}

export async function handler(event: {
  httpMethod: string;
  headers?: Record<string, string | undefined>;
}) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server configuration incomplete" }),
    };
  }

  const authHeader =
    event.headers?.authorization || event.headers?.Authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid session" }),
    };
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  try {
    const count = await syncAllMarkets(serviceClient);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, count }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Sync failed",
      }),
    };
  }
}
