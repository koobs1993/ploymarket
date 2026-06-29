const GAMMA_HOST = "https://gamma-api.polymarket.com";
const FIFA_WC_SERIES_ID = "11433";
const MATCH_SLUG_PATTERN = /^fifwc-[a-z0-9]{2,4}-[a-z0-9]{2,4}-\d{4}-\d{2}-\d{2}$/;
const PER_PAGE_TIMEOUT_MS = 8_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface GammaEvent {
  slug?: string;
  closed?: boolean;
  [key: string]: unknown;
}

function isMatchSlug(slug: string): boolean {
  return (
    MATCH_SLUG_PATTERN.test(slug) &&
    !slug.includes("halftime") &&
    !slug.includes("exact-score") &&
    !slug.includes("more-markets")
  );
}

async function fetchPage(offset: number): Promise<GammaEvent[]> {
  const params = new URLSearchParams({
    series_id: FIFA_WC_SERIES_ID,
    limit: "100",
    offset: String(offset),
    active: "true",
    closed: "false",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_PAGE_TIMEOUT_MS);
  try {
    const response = await fetch(`${GAMMA_HOST}/events?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Gamma responded ${response.status}`);
    }
    const data = (await response.json()) as GammaEvent[];
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

export async function handler(event: { httpMethod: string }) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const matches: GammaEvent[] = [];

  try {
    for (let offset = 0; offset < 1000; offset += 100) {
      let batch: GammaEvent[];
      try {
        batch = await fetchPage(offset);
      } catch (err) {
        console.error(`World Cup page fetch failed at offset ${offset}:`, err);
        break;
      }

      if (!batch.length) break;

      for (const item of batch) {
        if (item.slug && !item.closed && isMatchSlug(item.slug)) {
          matches.push(item);
        }
      }

      if (batch.length < 100) break;
    }
  } catch (err) {
    console.error("World Cup matches handler error:", err);
  }

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
    },
    body: JSON.stringify(matches),
  };
}
