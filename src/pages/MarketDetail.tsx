import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TrendChart } from "../components/TrendChart";
import { TradeHeader } from "../components/TradeHeader";
import { useAuth } from "../context/AuthContext";
import { useEventMarket } from "../hooks/useEventMarket";
import { placeBetOnOutcome } from "../utils/placeBet";
import type { WorldCupOutcome } from "../types";
import { formatPercent } from "../utils/format";

const STAKE_PRESETS = [1000, 2500, 5000, 10000] as const;
const VISIBLE_OUTCOMES = 6;

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(0)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

export function MarketDetailPage() {
  const { eventSlug = "" } = useParams();
  const { tradingAccount, refreshAccount } = useAuth();
  const { data, trends, chartData, loading, trendsLoading, error, isLive, lastUpdated } =
    useEventMarket(eventSlug);

  const [selectedOutcome, setSelectedOutcome] = useState<WorldCupOutcome | null>(
    null,
  );
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amountInput, setAmountInput] = useState("1000");
  const [selectedPreset, setSelectedPreset] = useState<number>(1000);
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [tradingSuccess, setTradingSuccess] = useState<string | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);

  const activeOutcome =
    selectedOutcome ?? data?.outcomes[0] ?? null;

  const activePrice = activeOutcome
    ? side === "yes"
      ? activeOutcome.price
      : 1 - activeOutcome.price
    : 0.5;

  const activeStake = parseFloat(amountInput.replace(/[^0-9.]/g, "")) || 0;
  const previewShares =
    activeOutcome && activeStake > 0 && activePrice > 0
      ? Math.floor(activeStake / activePrice)
      : 0;
  const previewProfit = previewShares - activeStake;

  const visibleOutcomes = showAllOutcomes
    ? data?.outcomes ?? []
    : (data?.outcomes ?? []).slice(0, VISIBLE_OUTCOMES);

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault();
    if (!tradingAccount || !data || !activeOutcome) return;

    if (tradingAccount.status !== "active") {
      setTradingError(
        "Your trading account is not active. Trades cannot be executed.",
      );
      return;
    }

    const amount = activeStake;
    if (Number.isNaN(amount) || amount <= 0) {
      setTradingError("Please enter a valid stake amount.");
      return;
    }

    setExecutingTrade(true);
    setTradingError(null);
    setTradingSuccess(null);

    try {
      const result = await placeBetOnOutcome({
        eventSlug,
        eventTitle: data.title,
        eventEndDate: data.endDate,
        outcome: activeOutcome,
        side,
        amount,
      });

      if (result?.success) {
        setTradingSuccess(
          `Successfully purchased ${Number(result.shares).toLocaleString()} shares!`,
        );
        setAmountInput("1000");
        setSelectedPreset(1000);
        await refreshAccount();
      }
    } catch (err) {
      console.error(err);
      setTradingError(
        err instanceof Error ? err.message : "Failed to place trade",
      );
    } finally {
      setExecutingTrade(false);
    }
  }

  function selectOutcome(outcome: WorldCupOutcome, betSide: "yes" | "no") {
    setSelectedOutcome(outcome);
    setSide(betSide);
    setTradingError(null);
    setTradingSuccess(null);
  }

  return (
    <div className="trade-app" style={{ backgroundColor: "#040812", minHeight: "100vh" }}>
      <TradeHeader />

      <div className="trade-container">
        <Link to="/trade" className="market-detail__back">
          ← All markets
        </Link>

        {loading && !data ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Loading market…
          </div>
        ) : error && !data ? (
          <div className="auth-alert auth-alert--error">{error}</div>
        ) : data ? (
          <div className="market-detail-grid">
            <div className="market-detail-main">
              <div className="market-detail-hero">
                <div className="market-detail-hero__top">
                  {data.icon && (
                    <img
                      src={data.icon}
                      alt=""
                      className="market-detail-hero__icon"
                    />
                  )}
                  <div>
                    <div className="market-detail-hero__breadcrumb">
                      Sports • Soccer
                    </div>
                    <h1 className="market-detail-hero__title">{data.title}</h1>
                  </div>
                </div>
                <div className="market-detail-hero__stats">
                  <span>{formatVolume(data.volume)} Vol.</span>
                  <span>•</span>
                  <span>
                    {new Date(data.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {data.outcomes.length > 0 && (
                <ul className="market-detail-leaders">
                  {data.outcomes.slice(0, 3).map((outcome, index) => (
                    <li key={outcome.id}>
                      <span
                        className="market-detail-leaders__dot"
                        style={{
                          background:
                            index === 0
                              ? "#22c55e"
                              : index === 1
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                      <span className="market-detail-leaders__name">
                        {outcome.title}
                      </span>
                      <span className="market-detail-leaders__odds">
                        {formatPercent(outcome.odds, 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="market-detail-chart">
                <TrendChart
                  series={trends}
                  chartData={chartData}
                  loading={trendsLoading}
                  isLive={isLive}
                  lastUpdated={lastUpdated}
                />
              </div>

              <div className="market-detail-outcomes">
                {visibleOutcomes.map((outcome) => {
                  const yesPrice = outcome.price;
                  const noPrice = 1 - yesPrice;
                  const isSelected = activeOutcome?.id === outcome.id;

                  return (
                    <div
                      key={outcome.id}
                      className={`outcome-row ${isSelected ? "outcome-row--selected" : ""}`}
                    >
                      <div className="outcome-row__info">
                        <h4>{outcome.title}</h4>
                        <p>{formatVolume(outcome.volume)} Vol.</p>
                      </div>
                      <div className="outcome-row__odds">
                        {formatPercent(outcome.odds, 0)}
                      </div>
                      <div className="outcome-row__actions">
                        <button
                          type="button"
                          className="outcome-row__btn outcome-row__btn--yes"
                          onClick={() => selectOutcome(outcome, "yes")}
                        >
                          <span>Buy Yes</span>
                          <strong>{(yesPrice * 100).toFixed(0)}¢</strong>
                        </button>
                        <button
                          type="button"
                          className="outcome-row__btn outcome-row__btn--no"
                          onClick={() => selectOutcome(outcome, "no")}
                        >
                          <span>Buy No</span>
                          <strong>{(noPrice * 100).toFixed(0)}¢</strong>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {(data.outcomes.length ?? 0) > VISIBLE_OUTCOMES && (
                  <button
                    type="button"
                    className="market-detail-show-more"
                    onClick={() => setShowAllOutcomes((value) => !value)}
                  >
                    {showAllOutcomes
                      ? "Show fewer markets"
                      : `Show ${data.outcomes.length - VISIBLE_OUTCOMES} more markets`}
                  </button>
                )}
              </div>

              {data.description && (
                <div className="stats-card market-detail-rules">
                  <h3 className="stats-card__title">Rules Summary</h3>
                  <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6 }}>
                    {data.description}
                  </p>
                </div>
              )}
            </div>

            <aside className="market-detail-sidebar">
              <div className="stats-card market-detail-panel">
                {activeOutcome ? (
                  <>
                    <div className="market-detail-panel__header">
                      {activeOutcome.icon && (
                        <img src={activeOutcome.icon} alt="" />
                      )}
                      <div>
                        <p>{data.title}</p>
                        <h3>{activeOutcome.title}</h3>
                      </div>
                    </div>

                    <div className="market-detail-panel__tabs">
                      <span className="market-detail-panel__tab market-detail-panel__tab--active">
                        Buy
                      </span>
                    </div>

                    <div className="market-detail-panel__sides">
                      <button
                        type="button"
                        className={`market-detail-panel__side ${side === "yes" ? "market-detail-panel__side--yes-active" : ""}`}
                        onClick={() => setSide("yes")}
                      >
                        <span>Yes</span>
                        <strong>
                          {(activeOutcome.price * 100).toFixed(0)}¢
                        </strong>
                      </button>
                      <button
                        type="button"
                        className={`market-detail-panel__side ${side === "no" ? "market-detail-panel__side--no-active" : ""}`}
                        onClick={() => setSide("no")}
                      >
                        <span>No</span>
                        <strong>
                          {((1 - activeOutcome.price) * 100).toFixed(0)}¢
                        </strong>
                      </button>
                    </div>

                    <form onSubmit={handlePlaceBet} className="auth-form">
                      <label className="market-detail-amount">
                        <span className="market-detail-amount__label">Amount</span>
                        <div className="market-detail-amount__field">
                          <span className="market-detail-amount__currency">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={amountInput}
                            onChange={(e) => {
                              setAmountInput(e.target.value.replace(/[^0-9.]/g, ""));
                              setSelectedPreset(0);
                              setTradingError(null);
                              setTradingSuccess(null);
                            }}
                          />
                        </div>
                      </label>

                      <div className="wc-stake-options">
                        {STAKE_PRESETS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={`wc-stake-option ${selectedPreset === amount ? "wc-stake-option--active" : ""}`}
                            onClick={() => {
                              setAmountInput(String(amount));
                              setSelectedPreset(amount);
                              setTradingError(null);
                              setTradingSuccess(null);
                            }}
                          >
                            +${amount.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      {previewShares > 0 && (
                        <div className="wc-calculator__results">
                          <div className="wc-result-grid">
                            <div>
                              <div className="wc-result-label">Shares to Buy</div>
                              <div className="wc-result-value">
                                {previewShares.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="wc-result-label">Profit If Wins</div>
                              <div
                                className="wc-result-value"
                                style={{ color: "var(--gold)" }}
                              >
                                $
                                {previewProfit.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {tradingError && (
                        <div className="auth-alert auth-alert--error">
                          {tradingError}
                        </div>
                      )}
                      {tradingSuccess && (
                        <div className="auth-alert auth-alert--success">
                          {tradingSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={
                          executingTrade ||
                          !tradingAccount ||
                          tradingAccount.status !== "active"
                        }
                        className="auth-button auth-button--gold"
                      >
                        {executingTrade
                          ? "Executing Trade…"
                          : tradingAccount?.status !== "active"
                            ? "Trading Disabled"
                            : "Execute Bet"}
                      </button>
                    </form>
                  </>
                ) : (
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                    Select an outcome to place a trade.
                  </p>
                )}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
