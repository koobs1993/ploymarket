import {
  FIFA_WC_SERIES_ID,
  WORLD_CUP_MATCH_SLUG_PATTERN,
} from "./constants/markets";
import type {
  BetResult,
  PolymarketEvent,
  PolymarketMarket,
  PriceHistoryPoint,
  TradeEventSummary,
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
export const EVENT_DETAIL_TREND_COUNT = 6;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildApiUrl(
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

function parseEventSummary(event: PolymarketEvent, slug: string): TradeEventSummary {
  const outcomes = (event.markets ?? [])
    .map((market) => toOutcome(market))
    .filter((item): item is WorldCupOutcome => item !== null)
    .filter((outcome) => !isPlaceholderOutcome(outcome))
    .sort((a, b) => b.odds - a.odds);

  return {
    slug,
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

function isWorldCupMatchSlug(slug: string): boolean {
  if (!WORLD_CUP_MATCH_SLUG_PATTERN.test(slug)) return false;
  return !slug.includes("halftime") &&
    !slug.includes("exact-score") &&
    !slug.includes("more-markets");
}

async function fetchSeriesEvents(seriesId: string): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];

  for (let offset = 0; offset < 2000; offset += 100) {
    const params = new URLSearchParams({
      series_id: seriesId,
      limit: "100",
      offset: String(offset),
    });
    const response = await fetchWithRetry(buildApiUrl("gamma", "events", params));
    const batch: PolymarketEvent[] = await response.json();
    if (!batch.length) break;
    allEvents.push(...batch);
    if (batch.length < 100) break;
  }

  return allEvents;
}

export async function fetchWorldCupMatchEvents(): Promise<TradeEventSummary[]> {
  const events = await fetchSeriesEvents(FIFA_WC_SERIES_ID);

  return events
    .filter((event) => event.slug && isWorldCupMatchSlug(event.slug) && !event.closed)
    .sort(
      (a, b) =>
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    )
    .map((event) => parseEventSummary(event, event.slug!));
}

export async function fetchWorldCupMatchSlugs(): Promise<string[]> {
  const events = await fetchWorldCupMatchEvents();
  return events.map((event) => event.slug);
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

  const summary = parseEventSummary(event, slug);
  return {
    title: summary.title,
    endDate: summary.endDate,
    icon: summary.icon,
    volume: summary.volume,
    description: summary.description,
    outcomes: summary.outcomes,
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
  limit = TREND_TEAM_COUNT,
): Promise<TrendSeries[]> {
  const series: TrendSeries[] = [];
  let colorIndex = 0;

  for (const outcome of outcomes) {
    if (series.length >= limit) break;

    const history = await fetchPriceHistory(outcome.clobTokenId);
    if (history.length === 0) continue;

    series.push({
      id: outcome.id,
      title: outcome.title,
      color: getCountryColor(outcome.title, colorIndex),
      clobTokenId: outcome.clobTokenId,
      history,
    });
    colorIndex += 1;
  }

  return series;
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

function isPlaceholderOutcome(outcome: WorldCupOutcome): boolean {
  return /^Player [A-Z]$/i.test(outcome.title.trim());
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
