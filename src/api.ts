import type {
  BetResult,
  PolymarketEvent,
  PolymarketMarket,
  PriceHistoryPoint,
  TrendChartPoint,
  TrendSeries,
  WorldCupData,
  WorldCupOutcome,
} from "./types";
import { getCountryColor } from "./utils/countryCodes";

const GAMMA_HOST = "https://gamma-api.polymarket.com";
const CLOB_HOST = "https://clob.polymarket.com";
const WORLD_CUP_EVENT_SLUG = "world-cup-winner";
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_RETRIES = 3;

export const TREND_TEAM_COUNT = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildApiUrl(
  service: "gamma" | "clob",
  path: string,
  params: URLSearchParams,
): string {
  if (import.meta.env.DEV) {
    const host = service === "gamma" ? GAMMA_HOST : CLOB_HOST;
    const query = params.toString();
    return `${host}/${path}${query ? `?${query}` : ""}`;
  }

  const proxyParams = new URLSearchParams(params);
  proxyParams.set("service", service);
  proxyParams.set("path", path);
  return `/.netlify/functions/polymarket?${proxyParams.toString()}`;
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string) {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) return response;

      lastError = new Error(`Polymarket API error: ${response.status}`);
      if (response.status >= 400 && response.status < 500) {
        throw lastError;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error("Polymarket request timed out");
      } else {
        lastError =
          err instanceof Error ? err : new Error("Failed to reach Polymarket");
      }
    }

    if (attempt < FETCH_RETRIES - 1) {
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError ?? new Error("Failed to reach Polymarket");
}

export async function fetchWorldCupData(): Promise<WorldCupData> {
  return fetchEventBySlug(WORLD_CUP_EVENT_SLUG);
}

export async function fetchEventBySlug(slug: string): Promise<WorldCupData> {
  const params = new URLSearchParams({
    slug,
    active: "true",
    closed: "false",
  });

  const response = await fetchWithRetry(buildApiUrl("gamma", "events", params));

  const events: PolymarketEvent[] = await response.json();
  const event = events[0];
  if (!event) {
    throw new Error("Market not found");
  }

  const outcomes = (event.markets ?? [])
    .map((market) => toOutcome(market))
    .filter((item): item is WorldCupOutcome => item !== null)
    .sort((a, b) => b.odds - a.odds);

  return {
    title: event.title.trim(),
    endDate: event.endDate,
    icon: event.icon || event.image,
    volume: Number(event.volume) || 0,
    description:
      event.eventMetadata?.context_description?.trim() ||
      event.description?.trim() ||
      "",
    outcomes,
  };
}

export async function fetchPriceHistory(
  clobTokenId: string,
): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams({
    market: clobTokenId,
    interval: "max",
    fidelity: "1440",
  });

  const response = await fetchWithRetry(
    buildApiUrl("clob", "prices-history", params),
  );

  const payload: { history?: PriceHistoryPoint[] } = await response.json();
  return payload.history ?? [];
}

export async function fetchTrendSeries(
  outcomes: WorldCupOutcome[],
): Promise<TrendSeries[]> {
  const topOutcomes = outcomes.slice(0, TREND_TEAM_COUNT);

  const histories = await Promise.all(
    topOutcomes.map(async (outcome, index) => ({
      id: outcome.id,
      title: outcome.title,
      color: getCountryColor(outcome.title, index),
      clobTokenId: outcome.clobTokenId,
      history: await fetchPriceHistory(outcome.clobTokenId),
    })),
  );

  return histories;
}

export function mergeTrendSeries(series: TrendSeries[]): TrendChartPoint[] {
  const byDay = new Map<number, TrendChartPoint>();

  for (const team of series) {
    const key = teamKey(team.title);

    for (const point of team.history) {
      const dayTs = Math.floor(point.t / 86_400) * 86_400;
      const existing =
        byDay.get(dayTs) ??
        ({
          ts: dayTs,
          label: formatChartLabel(dayTs),
        } as TrendChartPoint);

      existing[key] = point.p * 100;
      byDay.set(dayTs, existing);
    }
  }

  return Array.from(byDay.values()).sort((a, b) => a.ts - b.ts);
}

export function applyLivePricesToOutcomes(
  outcomes: WorldCupOutcome[],
  livePrices: Map<string, number>,
): WorldCupOutcome[] {
  if (livePrices.size === 0) return outcomes;

  return outcomes
    .map((outcome) => {
      const livePrice = livePrices.get(outcome.clobTokenId);
      if (livePrice === undefined) return outcome;

      return {
        ...outcome,
        price: livePrice,
        odds: livePrice * 100,
      };
    })
    .sort((a, b) => b.odds - a.odds);
}

export function applyLivePricesToChart(
  chartData: TrendChartPoint[],
  series: TrendSeries[],
  livePrices: Map<string, number>,
): TrendChartPoint[] {
  if (livePrices.size === 0 || series.length === 0) return chartData;

  const now = Math.floor(Date.now() / 1000);
  const liveTs = Math.floor(now / 300) * 300;
  const result = [...chartData];
  const lastIndex = result.length - 1;
  const lastPoint = result[lastIndex];
  const point: TrendChartPoint =
    lastPoint?.ts === liveTs
      ? { ...lastPoint }
      : { ts: liveTs, label: formatLiveLabel(liveTs) };

  for (const team of series) {
    const livePrice = livePrices.get(team.clobTokenId);
    if (livePrice !== undefined) {
      point[teamKey(team.title)] = livePrice * 100;
    }
  }

  if (lastPoint?.ts === liveTs) {
    result[lastIndex] = point;
  } else {
    result.push(point);
  }

  return result;
}

function toOutcome(market: PolymarketMarket): WorldCupOutcome | null {
  if (!market.outcomePrices || !market.clobTokenIds) return null;

  let prices: string[];
  let tokenIds: string[];
  try {
    prices = JSON.parse(market.outcomePrices);
    tokenIds = JSON.parse(market.clobTokenIds);
  } catch {
    return null;
  }

  const price = parseFloat(prices[0]);
  if (Number.isNaN(price) || price <= 0 || !tokenIds[0]) return null;

  return {
    id: market.id,
    title: market.groupItemTitle || market.question,
    icon: market.icon || market.image,
    price,
    odds: price * 100,
    change: (market.oneDayPriceChange ?? 0) * 100,
    volume: Number(market.volume) || 0,
    clobTokenId: tokenIds[0],
  };
}

export function calculateBet(stake: number, price: number): BetResult {
  const shares = stake / price;
  const totalReturn = shares;
  const profit = totalReturn - stake;

  return { stake, price, shares, totalReturn, profit };
}

export function teamKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function formatChartLabel(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatLiveLabel(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
