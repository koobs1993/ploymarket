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

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";
const WORLD_CUP_EVENT_SLUG = "world-cup-winner";

export const TREND_COLORS = ["#ffc145", "#ffe08a", "#f59e0b"] as const;
export const TREND_TEAM_COUNT = 3;

export async function fetchWorldCupData(): Promise<WorldCupData> {
  const params = new URLSearchParams({
    slug: WORLD_CUP_EVENT_SLUG,
    active: "true",
    closed: "false",
  });

  const response = await fetch(`${GAMMA_API}/events?${params}`);
  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  const events: PolymarketEvent[] = await response.json();
  const event = events[0];
  if (!event) {
    throw new Error("World Cup market not found");
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

  const response = await fetch(`${CLOB_API}/prices-history?${params}`);
  if (!response.ok) {
    throw new Error(`Price history error: ${response.status}`);
  }

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
      color: TREND_COLORS[index] ?? TREND_COLORS[0],
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
