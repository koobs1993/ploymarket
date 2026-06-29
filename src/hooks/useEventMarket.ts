import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyLivePricesToChart,
  applyLivePricesToOutcomes,
  fetchEventBySlug,
  EVENT_DETAIL_TREND_COUNT,
  fetchTrendSeries,
  mergeTrendSeries,
} from "../api";
import { usePolymarketLivePrices } from "./usePolymarketLivePrices";
import type { TrendChartPoint, TrendSeries, WorldCupData } from "../types";

const MARKET_POLL_MS = 15_000;
const HISTORY_REFRESH_MS = 300_000;

function formatMarketError(err: unknown): string {
  if (!(err instanceof Error)) return "Failed to load markets";

  if (err.message.includes("timed out")) {
    return "Polymarket is taking too long to respond. Please refresh and try again.";
  }

  if (
    err.message.includes("Failed to fetch") ||
    err.message.includes("Failed to reach Polymarket") ||
    err.message.includes("NetworkError")
  ) {
    return "Couldn't reach Polymarket. Check your connection or refresh the page.";
  }

  return err.message;
}

export function useEventMarket(eventSlug: string) {
  const [baseData, setBaseData] = useState<WorldCupData | null>(null);
  const [baseTrends, setBaseTrends] = useState<TrendSeries[]>([]);
  const [baseChartData, setBaseChartData] = useState<TrendChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseDataRef = useRef<WorldCupData | null>(null);

  const liveTokenIds = useMemo(
    () => baseTrends.map((team) => team.clobTokenId),
    [baseTrends],
  );

  const { prices: livePrices, connected, lastUpdate } =
    usePolymarketLivePrices(liveTokenIds);

  useEffect(() => {
    baseDataRef.current = baseData;
  }, [baseData]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory(outcomes: WorldCupData["outcomes"]) {
      setTrendsLoading(true);
      try {
        const nextTrends = await fetchTrendSeries(
          outcomes,
          EVENT_DETAIL_TREND_COUNT,
        );
        if (cancelled) return;
        setBaseTrends(nextTrends);
        setBaseChartData(mergeTrendSeries(nextTrends));
        setTrendsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(formatMarketError(err));
          setTrendsLoading(false);
        }
      }
    }

    async function loadMarkets(isInitial = false) {
      try {
        const next = await fetchEventBySlug(eventSlug);
        if (cancelled) return next;
        setBaseData(next);
        setError(null);
        return next;
      } catch (err) {
        if (!cancelled) {
          setError(formatMarketError(err));
        }
        return null;
      } finally {
        if (!cancelled && isInitial) {
          setLoading(false);
        }
      }
    }

    async function init() {
      setLoading(true);
      setTrendsLoading(true);
      setError(null);
      const next = await loadMarkets(true);
      if (next) await loadHistory(next.outcomes);
    }

    init();

    const marketTimer = setInterval(() => {
      loadMarkets();
    }, MARKET_POLL_MS);

    const historyTimer = setInterval(() => {
      if (baseDataRef.current) {
        loadHistory(baseDataRef.current.outcomes);
      }
    }, HISTORY_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(marketTimer);
      clearInterval(historyTimer);
    };
  }, [eventSlug]);

  const data = useMemo(
    () =>
      baseData
        ? {
            ...baseData,
            outcomes: applyLivePricesToOutcomes(baseData.outcomes, livePrices),
          }
        : null,
    [baseData, livePrices],
  );

  const trends = useMemo(
    () =>
      baseTrends.map((team) => {
        const livePrice = livePrices.get(team.clobTokenId);
        if (livePrice === undefined) return team;

        const history = [...team.history];
        const last = history.at(-1);
        if (last) {
          history[history.length - 1] = {
            t: Math.floor(Date.now() / 1000),
            p: livePrice,
          };
        }

        return { ...team, history };
      }),
    [baseTrends, livePrices, lastUpdate],
  );

  const chartData = useMemo(
    () => applyLivePricesToChart(baseChartData, baseTrends, livePrices),
    [baseChartData, baseTrends, livePrices, lastUpdate],
  );

  return {
    data,
    trends,
    chartData,
    loading,
    trendsLoading,
    error,
    isLive: connected,
    lastUpdated: lastUpdate,
  };
}
