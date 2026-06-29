import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEventBySlug } from "../api";
import { TRADE_EVENT_SLUGS } from "../constants/markets";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";
import type { WorldCupData } from "../types";

interface DailyStats {
  opening_equity: number;
  lowest_equity: number;
  realized_pnl: number;
}

interface EventSummary extends WorldCupData {
  slug: string;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `$${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(0)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

export function TradePage() {
  const { tradingAccount } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoadingEvents(true);
      setLoadError(null);
      try {
        const results = await Promise.all(
          TRADE_EVENT_SLUGS.map(async (slug) => {
            const data = await fetchEventBySlug(slug);
            return { ...data, slug };
          }),
        );
        if (!cancelled) setEvents(results);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load markets",
          );
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tradingAccount) {
      fetchDailyStats();
    }
  }, [tradingAccount?.id]);

  async function fetchDailyStats() {
    if (!tradingAccount) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("account_daily_stats")
        .select("*")
        .eq("account_id", tradingAccount.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setDailyStats({
          opening_equity: Number(data.opening_equity),
          lowest_equity: Number(data.lowest_equity),
          realized_pnl: Number(data.realized_pnl),
        });
      } else {
        setDailyStats(null);
      }
    } catch (err) {
      console.error("Error loading daily stats:", err);
    }
  }

  const maxTotalLoss = 10000;
  const maxDailyLoss = 5000;
  const startBalance = tradingAccount?.starting_balance || 100000;
  const currentEquity = tradingAccount?.equity || startBalance;
  const totalMinEquity = startBalance - maxTotalLoss;
  const totalDrawdownRemaining = Math.max(0, currentEquity - totalMinEquity);
  const totalBufferPercent = Math.min(
    100,
    Math.max(0, (totalDrawdownRemaining / maxTotalLoss) * 100),
  );
  const dailyOpeningEquity = dailyStats?.opening_equity || currentEquity;
  const dailyMinEquity = dailyOpeningEquity - maxDailyLoss;
  const dailyDrawdownRemaining = Math.max(0, currentEquity - dailyMinEquity);
  const dailyBufferPercent = Math.min(
    100,
    Math.max(0, (dailyDrawdownRemaining / maxDailyLoss) * 100),
  );
  const daysRemaining = tradingAccount
    ? Math.max(
        0,
        Math.ceil(
          (new Date(tradingAccount.expires_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div style={{ backgroundColor: "#040812", minHeight: "100vh" }}>
      <TradeHeader />

      <div className="trade-container">
        {tradingAccount?.status === "breached" && (
          <div className="breached-banner">
            <span className="breached-banner__icon">🚨</span>
            <div>
              <div className="breached-banner__title">Account Breached</div>
              <div className="breached-banner__desc">
                {tradingAccount.breach_reason ||
                  "This account has violated the challenge drawdown rules and is now locked."}
              </div>
            </div>
          </div>
        )}

        {tradingAccount?.status === "expired" && (
          <div
            className="breached-banner"
            style={{
              backgroundColor: "rgba(107, 114, 128, 0.1)",
              borderColor: "rgba(107, 114, 128, 0.3)",
            }}
          >
            <span className="breached-banner__icon">⏳</span>
            <div>
              <div
                className="breached-banner__title"
                style={{ color: "#9ca3af" }}
              >
                Challenge Expired
              </div>
              <div className="breached-banner__desc">
                This challenge account has exceeded its duration limit and is
                closed for new trades.
              </div>
            </div>
          </div>
        )}

        {tradingAccount && (
          <div className="stats-card">
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-item__label">Cash Balance</div>
                <div className="metric-item__value">
                  $
                  {tradingAccount.cash_balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Account Equity</div>
                <div
                  className="metric-item__value"
                  style={{ color: "#3b82f6" }}
                >
                  $
                  {tradingAccount.equity.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Open Positions Value</div>
                <div
                  className="metric-item__value"
                  style={{ color: "#f59e0b" }}
                >
                  $
                  {tradingAccount.open_positions_value.toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Today's Realized P&L</div>
                <div
                  className={`metric-item__value ${dailyStats && dailyStats.realized_pnl > 0 ? "metric-item__value--positive" : dailyStats && dailyStats.realized_pnl < 0 ? "metric-item__value--negative" : ""}`}
                >
                  {dailyStats && dailyStats.realized_pnl !== 0
                    ? `${dailyStats.realized_pnl > 0 ? "+" : ""}$${dailyStats.realized_pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "$0.00"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              <div className="rules-list">
                <div className="rule-progress">
                  <div className="rule-progress__header">
                    <span className="rule-progress__label">
                      Total Drawdown Limit (Max -$10K)
                    </span>
                    <span className="rule-progress__value">
                      $
                      {totalDrawdownRemaining.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      buffer
                    </span>
                  </div>
                  <div className="rule-progress__bar-bg">
                    <div
                      className={`rule-progress__bar-fill ${totalBufferPercent < 30 ? "rule-progress__bar-fill--danger" : totalBufferPercent < 60 ? "rule-progress__bar-fill--warning" : ""}`}
                      style={{ width: `${totalBufferPercent}%` }}
                    />
                  </div>
                </div>

                <div className="rule-progress">
                  <div className="rule-progress__header">
                    <span className="rule-progress__label">
                      Daily Drawdown Limit (Max -$5K)
                    </span>
                    <span className="rule-progress__value">
                      $
                      {dailyDrawdownRemaining.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      buffer
                    </span>
                  </div>
                  <div className="rule-progress__bar-bg">
                    <div
                      className={`rule-progress__bar-fill ${dailyBufferPercent < 30 ? "rule-progress__bar-fill--danger" : dailyBufferPercent < 60 ? "rule-progress__bar-fill--warning" : ""}`}
                      style={{ width: `${dailyBufferPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "8px",
                  borderLeft: "1px solid #1f2937",
                  paddingLeft: "24px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    Time Remaining
                  </span>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {daysRemaining}{" "}
                    <span style={{ fontSize: "16px", color: "#9ca3af" }}>
                      Days
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Active Challenge ends:{" "}
                  {new Date(tradingAccount.expires_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <h2 className="markets-section-title">World Cup Markets</h2>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              margin: "0 0 24px 0",
            }}
          >
            Live odds from Polymarket. Select a market to view outcomes and place
            a trade.
          </p>

          {loadingEvents ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              Loading markets from Polymarket…
            </div>
          ) : loadError ? (
            <div className="auth-alert auth-alert--error">{loadError}</div>
          ) : (
            <div className="event-catalog">
              {events.map((event) => {
                const topOutcomes = event.outcomes.slice(0, 3);
                return (
                  <Link
                    key={event.slug}
                    to={`/trade/${event.slug}`}
                    className="event-card"
                  >
                    <div className="event-card__header">
                      {event.icon && (
                        <img
                          src={event.icon}
                          alt=""
                          className="event-card__icon"
                        />
                      )}
                      <div className="event-card__meta">
                        <h3 className="event-card__title">{event.title}</h3>
                        <div className="event-card__stats">
                          <span>{formatVolume(event.volume)} Vol.</span>
                          <span>•</span>
                          <span>
                            {new Date(event.endDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {topOutcomes.length > 0 && (
                      <ul className="event-card__outcomes">
                        {topOutcomes.map((outcome) => (
                          <li key={outcome.id}>
                            <span className="event-card__outcome-name">
                              {outcome.title}
                            </span>
                            <span className="event-card__outcome-odds">
                              {outcome.odds.toFixed(0)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="event-card__cta">View market →</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
