import { useMemo, useState } from "react";
import { calculateBet } from "../api";
import { useWorldCup } from "../hooks/useWorldCupData";
import type { WorldCupOutcome } from "../types";
import { getCountryCode } from "../utils/countryCodes";
import {
  formatCurrency,
  formatCurrencyExact,
  formatDate,
  formatPercent,
} from "../utils/format";

const STAKE_PRESETS = [10_000, 25_000, 50_000, 100_000] as const;
const DEFAULT_STAKE = STAKE_PRESETS[STAKE_PRESETS.length - 1];
const TOP_TEAMS_LIMIT = 12;

function TeamOption({
  outcome,
  active,
  onSelect,
}: {
  outcome: WorldCupOutcome;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const code = getCountryCode(outcome.title);

  return (
    <button
      type="button"
      className={`wc-team-option${active ? " wc-team-option--active" : ""}`}
      aria-pressed={active}
      onClick={() => onSelect(outcome.id)}
    >
      <img className="wc-team-option__flag" src={outcome.icon} alt="" />
      <span className="wc-team-option__body">
        <span className="wc-team-option__code">{code}</span>
        <span className="wc-team-option__name">{outcome.title}</span>
        <span className="wc-team-option__odds">{formatPercent(outcome.odds)}</span>
      </span>
    </button>
  );
}

function OutcomeRow({
  outcome,
  maxOdds,
}: {
  outcome: WorldCupOutcome;
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

export function WorldCupPanel() {
  const { data, error, loading } = useWorldCup();
  const [stake, setStake] = useState(DEFAULT_STAKE);
  const [selectedId, setSelectedId] = useState<string>("");

  const selectedOutcome = useMemo(() => {
    if (!data) return null;
    const match = data.outcomes.find((outcome) => outcome.id === selectedId);
    return match ?? data.outcomes[0] ?? null;
  }, [data, selectedId]);

  const bet = useMemo(() => {
    if (!selectedOutcome) return null;
    return calculateBet(stake, selectedOutcome.price);
  }, [selectedOutcome, stake]);

  if (loading && !data) {
    return <div className="wc-panel wc-panel--loading">Loading World Cup markets…</div>;
  }

  if (error && !data) {
    return <div className="wc-panel wc-panel--error">{error}</div>;
  }

  if (!data) return null;

  const topOutcomes = data.outcomes.slice(0, TOP_TEAMS_LIMIT);
  const maxOdds = topOutcomes[0]?.odds ?? 0;
  const activeId = selectedOutcome?.id ?? "";

  return (
    <section className="wc-panel">
      <div className="wc-card">
          <div className="wc-card__header">
            <span className="wc-card__label">World Cup</span>
            <span className="wc-card__date">{formatDate(data.endDate)}</span>
          </div>

          <div className="wc-card__title-row">
            <img className="wc-card__icon" src={data.icon} alt="" />
            <div>
              <h2 className="wc-card__title">{data.title}</h2>
              <p className="wc-card__meta">Top {TOP_TEAMS_LIMIT} by odds</p>
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
        </div>

      <div className="wc-calculator">
          <h3 className="wc-calculator__title">Bet calculator</h3>
          <p className="wc-calculator__subtitle">
            See what a winning bet would pay out at current Polymarket prices.
          </p>

          <div className="wc-calculator__fields">
            <div className="wc-field">
              <span className="wc-field__label">Stake</span>
              <div className="wc-stake-options" role="group" aria-label="Stake amount">
                {STAKE_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`wc-stake-option${stake === amount ? " wc-stake-option--active" : ""}`}
                    aria-pressed={stake === amount}
                    onClick={() => setStake(amount)}
                  >
                    {formatCurrencyExact(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="wc-field">
              <span className="wc-field__label">Team</span>
              <div className="wc-team-options" role="group" aria-label="Select team">
                {topOutcomes.map((outcome) => (
                  <TeamOption
                    key={outcome.id}
                    outcome={outcome}
                    active={activeId === outcome.id}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            </div>
          </div>

          {bet && selectedOutcome ? (
            <div className="wc-calculator__results">
              <p className="wc-calculator__scenario">
                If <strong>{selectedOutcome.title}</strong> wins at{" "}
                {formatPercent(selectedOutcome.odds)} odds on a{" "}
                {formatCurrency(stake)} stake
              </p>
              <div className="wc-result-grid">
                <div className="wc-result">
                  <span className="wc-result__label">Total return</span>
                  <span className="wc-result__value">
                    {formatCurrencyExact(bet.totalReturn)}
                  </span>
                </div>
                <div className="wc-result">
                  <span className="wc-result__label">Profit</span>
                  <span className="wc-result__value wc-result__value--profit">
                    {formatCurrencyExact(bet.profit)}
                  </span>
                </div>
                <div className="wc-result">
                  <span className="wc-result__label">Shares bought</span>
                  <span className="wc-result__value">
                    {bet.shares.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
      </div>
    </section>
  );
}
