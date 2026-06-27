import { useEffect, useState } from "react";
import { fetchEventBySlug } from "../api";
import { useWorldCup } from "../hooks/useWorldCupData";
import { secondaryMarketSlugs } from "../data/landingContent";
import type { WorldCupData } from "../types";
import { getCountryCode } from "../utils/countryCodes";
import { formatCurrency, formatDate, formatPercent } from "../utils/format";
import { PredictButton } from "./landing/PredictButton";

const WINNER_LIMIT = 8;
const COMPACT_LIMIT = 4;

function OutcomeRow({
  outcome,
  maxOdds,
}: {
  outcome: WorldCupData["outcomes"][number];
  maxOdds: number;
}) {
  const barWidth = maxOdds > 0 ? (outcome.odds / maxOdds) * 100 : 0;
  const code = getCountryCode(outcome.title);

  return (
    <div className="wc-outcome">
      <div className="wc-outcome__team">
        <img className="wc-outcome__flag" src={outcome.icon} alt="" />
        <span className="wc-outcome__code">{code}</span>
        <span className="wc-outcome__name">{outcome.title}</span>
      </div>
      <div className="wc-outcome__bar-wrap">
        <div className="wc-outcome__bar" style={{ width: `${barWidth}%` }} />
      </div>
      <span className="wc-outcome__odds">{formatPercent(outcome.odds)}</span>
    </div>
  );
}

function CompactCard({ market }: { market: WorldCupData }) {
  const outcomes = market.outcomes.slice(0, COMPACT_LIMIT);
  const maxOdds = outcomes[0]?.odds ?? 0;

  return (
    <article className="prediction-card prediction-card--compact wc-card">
      <div className="prediction-card__header">
        <img className="prediction-card__icon" src={market.icon} alt="" />
        <div>
          <h3 className="prediction-card__title">{market.title}</h3>
          <p className="prediction-card__meta">Live Polymarket odds</p>
        </div>
      </div>
      <div className="prediction-card__outcomes">
        {outcomes.map((outcome) => (
          <OutcomeRow key={outcome.id} outcome={outcome} maxOdds={maxOdds} />
        ))}
      </div>
      <PredictButton className="prediction-card__cta" />
    </article>
  );
}

export function WorldCupPredictions() {
  const { data, error, loading } = useWorldCup();
  const [secondary, setSecondary] = useState<WorldCupData[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSecondary() {
      const results = await Promise.allSettled(
        secondaryMarketSlugs.map((slug) => fetchEventBySlug(slug)),
      );

      if (cancelled) return;

      setSecondary(
        results
          .filter((result): result is PromiseFulfilledResult<WorldCupData> =>
            result.status === "fulfilled",
          )
          .map((result) => result.value),
      );
    }

    loadSecondary();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return <div className="wc-panel wc-panel--loading">Loading predictions…</div>;
  }

  if (error && !data) {
    return <div className="wc-panel wc-panel--error">{error}</div>;
  }

  if (!data) return null;

  const topOutcomes = data.outcomes.slice(0, WINNER_LIMIT);
  const maxOdds = topOutcomes[0]?.odds ?? 0;

  return (
    <div className="predictions-stack">
      <article className="prediction-card wc-card">
        <div className="wc-card__header">
          <span className="wc-card__label">World Cup</span>
          <span className="wc-card__date">{formatDate(data.endDate)}</span>
        </div>

        <div className="wc-card__title-row">
          <img className="wc-card__icon" src={data.icon} alt="" />
          <div>
            <h3 className="wc-card__title">{data.title}</h3>
            <p className="wc-card__meta">Top {WINNER_LIMIT} by odds</p>
          </div>
        </div>

        <div className="wc-card__outcomes">
          {topOutcomes.map((outcome) => (
            <OutcomeRow key={outcome.id} outcome={outcome} maxOdds={maxOdds} />
          ))}
        </div>

        <div className="wc-card__footer">
          <span className="wc-card__vol-label">Vol</span>
          <span className="wc-card__vol-value">{formatCurrency(data.volume)}</span>
        </div>

        <PredictButton className="prediction-card__cta" />
      </article>

      <div className="predictions-grid">
        {secondary.map((market) => (
          <CompactCard key={market.title} market={market} />
        ))}
      </div>
    </div>
  );
}
