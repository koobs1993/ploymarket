import { useWorldCup } from "../hooks/useWorldCupData";
import type { WorldCupOutcome } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";
import { TrendChart } from "./TrendChart";

function formatMultiplier(price: number): string {
  return `${(1 / price).toFixed(2)}x`;
}

function HeroTeamRow({ outcome }: { outcome: WorldCupOutcome }) {
  return (
    <div className="wc-hero-team">
      <img className="wc-hero-team__icon" src={outcome.icon} alt="" />
      <div className="wc-hero-team__info">
        <span className="wc-hero-team__name">{outcome.title}</span>
        <span className="wc-hero-team__multiplier">
          {formatMultiplier(outcome.price)}
        </span>
      </div>
      <span className="wc-hero-team__odds">{formatPercent(outcome.odds)}</span>
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

  const featured = data.outcomes.slice(0, compact ? 2 : 2);
  const remaining = Math.max(data.outcomes.length - featured.length, 0);

  return (
    <section className={`wc-hero ${compact ? "wc-hero--compact" : ""}`}>
      <div className="wc-hero__inner">
        {!compact && (
          <div className="wc-hero__sidebar">
            <div className="wc-hero__teams">
              {featured.map((outcome) => (
                <HeroTeamRow key={outcome.id} outcome={outcome} />
              ))}
            </div>

            <div className="wc-hero__volume">
              <span className="wc-hero__volume-value">
                {formatCurrency(data.volume)}
              </span>
              <span className="wc-hero__volume-label">vol</span>
            </div>

            {remaining > 0 && <p className="wc-hero__more">{remaining} more</p>}

            {data.description && (
              <div className="wc-hero__news">
                <span className="wc-hero__news-label">News</span>
                <p className="wc-hero__news-text">{data.description}</p>
              </div>
            )}
          </div>
        )}

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
      </div>
    </section>
  );
}
