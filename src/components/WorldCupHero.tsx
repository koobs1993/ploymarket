import { useWorldCup } from "../hooks/useWorldCupData";
import type { WorldCupOutcome } from "../types";
import { getCountryCode } from "../utils/countryCodes";
import { formatPercent } from "../utils/format";
import { TrendChart } from "./TrendChart";

function TopPick({ outcome }: { outcome: WorldCupOutcome }) {
  return (
    <div className="top-pick">
      <img className="top-pick__flag" src={outcome.icon} alt="" />
      <div className="top-pick__info">
        <span className="top-pick__code">{getCountryCode(outcome.title)}</span>
        <span className="top-pick__name">{outcome.title}</span>
      </div>
      <span className="top-pick__odds">{formatPercent(outcome.odds, 1)}</span>
    </div>
  );
}

interface WorldCupHeroProps {
  compact?: boolean;
}

export function WorldCupHero({ compact = false }: WorldCupHeroProps) {
  const {
    data,
    trends,
    chartData,
    loading,
    trendsLoading,
    error,
    isLive,
    lastUpdated,
  } = useWorldCup();

  if (loading && !data) {
    return (
      <section className="wc-hero wc-hero--loading">
        Loading World Cup predictions…
      </section>
    );
  }

  if (error && !data) {
    return <section className="wc-hero wc-hero--error">{error}</section>;
  }

  if (!data) return null;

  const topPicks = data.outcomes.slice(0, 2);

  return (
    <section className={`wc-hero ${compact ? "wc-hero--compact" : ""}`}>
      <div className="wc-hero__inner">
        <div className="wc-hero__chart-wrap">
          <TrendChart
            series={trends}
            chartData={chartData}
            loading={trendsLoading}
            isLive={isLive}
            lastUpdated={lastUpdated}
            compact={compact}
          />
        </div>

        {compact && topPicks.length > 0 && (
          <div className="top-picks">
            {topPicks.map((outcome) => (
              <TopPick key={outcome.id} outcome={outcome} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
