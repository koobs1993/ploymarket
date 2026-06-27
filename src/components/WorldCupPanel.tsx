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

const DEFAULT_STAKE = 100_000;
const TOP_TEAMS_LIMIT = 12;

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
  const [stakeInput, setStakeInput] = useState(String(DEFAULT_STAKE));
  const [selectedId, setSelectedId] = useState<string>("");

  const stake = useMemo(() => {
    const parsed = Number(stakeInput.replace(/,/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [stakeInput]);

  const selectedOutcome = useMemo(() => {
    if (!data) return null;
    const match = data.outcomes.find((outcome) => outcome.id === selectedId);
    return match ?? data.outcomes[0] ?? null;
  }, [data, selectedId]);

  const bet = useMemo(() => {
    if (!selectedOutcome || stake <= 0) return null;
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
      <div className="wc-panel__grid">
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
            <label className="wc-field">
              <span className="wc-field__label">Stake</span>
              <div className="wc-field__input-wrap">
                <span className="wc-field__prefix">$</span>
                <input
                  className="wc-field__input"
                  type="text"
                  inputMode="numeric"
                  value={stakeInput}
                  onChange={(event) => setStakeInput(event.target.value)}
                />
              </div>
            </label>

            <label className="wc-field">
              <span className="wc-field__label">Team</span>
              <select
                className="wc-field__select"
                value={activeId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {topOutcomes.map((outcome) => (
                  <option key={outcome.id} value={outcome.id}>
                    {getCountryCode(outcome.title)} · {outcome.title} (
                    {formatPercent(outcome.odds)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {bet && selectedOutcome ? (
            <div className="wc-calculator__results">
              <p className="wc-calculator__scenario">
                If <strong>{selectedOutcome.title}</strong> wins at{" "}
                {formatPercent(selectedOutcome.odds)} odds
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
          ) : (
            <p className="wc-calculator__hint">Enter a valid stake amount to calculate.</p>
          )}
        </div>
      </div>
    </section>
  );
}
