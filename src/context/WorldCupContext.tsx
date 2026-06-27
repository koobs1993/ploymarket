import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyLivePricesToChart,
  applyLivePricesToOutcomes,
  fetchTrendSeries,
  fetchWorldCupData,
  mergeTrendSeries,
} from "../api";
import { usePolymarketLivePrices } from "../hooks/usePolymarketLivePrices";
import type { TrendChartPoint, TrendSeries, WorldCupData } from "../types";

const MARKET_POLL_MS = 15_000;
const HISTORY_REFRESH_MS = 300_000;

interface WorldCupContextValue {
  data: WorldCupData | null;
  trends: TrendSeries[];
  chartData: TrendChartPoint[];
  loading: boolean;
  trendsLoading: boolean;
  error: string | null;
  isLive: boolean;
  lastUpdated: number | null;
}

const WorldCupContext = createContext<WorldCupContextValue | null>(null);

export function WorldCupProvider({ children }: { children: ReactNode }) {
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
        const nextTrends = await fetchTrendSeries(outcomes);
        if (cancelled) return;
        setBaseTrends(nextTrends);
        setBaseChartData(mergeTrendSeries(nextTrends));
        setTrendsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load trends");
          setTrendsLoading(false);
        }
      }
    }

    async function loadMarkets() {
      try {
        const next = await fetchWorldCupData();
        if (cancelled) return;
        setBaseData(next);
        setError(null);
        setLoading(false);
        return next;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load markets");
          setLoading(false);
        }
        return null;
      }
    }

    async function init() {
      const next = await loadMarkets();
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
  }, []);

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

  return (
    <WorldCupContext.Provider
      value={{
        data,
        trends,
        chartData,
        loading,
        trendsLoading,
        error,
        isLive: connected,
        lastUpdated: lastUpdate,
      }}
    >
      {children}
    </WorldCupContext.Provider>
  );
}

export function useWorldCup() {
  const context = useContext(WorldCupContext);
  if (!context) {
    throw new Error("useWorldCup must be used within WorldCupProvider");
  }
  return context;
}
