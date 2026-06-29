import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";
import { syncMarkets } from "../utils/syncMarkets";

interface Market {
  polymarket_id: string;
  event_slug: string;
  slug: string;
  question: string;
  group_title: string | null;
  outcomes: {
    tokenIds: string[];
    prices: number[];
  };
  yes_price: number;
  no_price: number;
  end_date: string;
  closed: boolean;
}

interface DailyStats {
  opening_equity: number;
  lowest_equity: number;
  realized_pnl: number;
}

const STAKE_PRESETS = [1000, 2500, 5000, 10000] as const;

export function TradePage() {
  const { tradingAccount, refreshAccount } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [stake, setStake] = useState<number>(1000);
  const [customStake, setCustomStake] = useState<string>("");
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [tradingSuccess, setTradingSuccess] = useState<string | null>(null);
  const [executingTrade, setExecutingExecutingTrade] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchMarkets();
    if (tradingAccount) {
      fetchDailyStats();
    }
  }, [tradingAccount?.id]);

  async function fetchMarkets() {
    try {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("closed", false);

      if (error) throw error;
      setMarkets(data || []);
      if (data && data.length > 0 && !selectedMarket) {
        setSelectedMarket(data[0]);
      }
    } catch (err) {
      console.error("Error loading markets:", err);
    } finally {
      setLoadingMarkets(false);
    }
  }

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

  async function handleForceSync() {
    setIsSyncing(true);
    try {
      await syncMarkets();
      await fetchMarkets();
      await refreshAccount();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault();
    if (!tradingAccount || !selectedMarket) return;
    if (tradingAccount.status !== "active") {
      setTradingError("Your trading account is not active. Trades cannot be executed.");
      return;
    }

    const currentStake = customStake ? parseFloat(customStake) : stake;
    if (isNaN(currentStake) || currentStake <= 0) {
      setTradingError("Please enter a valid stake amount.");
      return;
    }

    setExecutingExecutingTrade(true);
    setTradingError(null);
    setTradingSuccess(null);

    try {
      const { data, error } = await supabase.rpc("place_bet", {
        p_market_id: selectedMarket.polymarket_id,
        p_side: side,
        p_amount: currentStake,
      });

      if (error) throw error;

      if (data && data.success) {
        setTradingSuccess(`Successfully purchased ${Number(data.shares).toLocaleString()} shares!`);
        setCustomStake("");
        await refreshAccount();
        await fetchDailyStats();
      }
    } catch (err) {
      console.error(err);
      setTradingError(err instanceof Error ? err.message : "Failed to place trade");
    } finally {
      setExecutingExecutingTrade(false);
    }
  }

  // Drawdown math
  const maxTotalLoss = 10000; // $10,000 drawdown limit
  const maxDailyLoss = 5000;  // $5,000 daily drawdown limit

  const startBalance = tradingAccount?.starting_balance || 100000;
  const currentEquity = tradingAccount?.equity || startBalance;

  // Total Drawdown
  const totalMinEquity = startBalance - maxTotalLoss;
  const totalDrawdownRemaining = Math.max(0, currentEquity - totalMinEquity);
  const totalBufferPercent = Math.min(100, Math.max(0, (totalDrawdownRemaining / maxTotalLoss) * 100));

  // Daily Drawdown
  const dailyOpeningEquity = dailyStats?.opening_equity || currentEquity;
  const dailyMinEquity = dailyOpeningEquity - maxDailyLoss;
  const dailyDrawdownRemaining = Math.max(0, currentEquity - dailyMinEquity);
  const dailyBufferPercent = Math.min(100, Math.max(0, (dailyDrawdownRemaining / maxDailyLoss) * 100));

  // Days remaining
  const daysRemaining = tradingAccount
    ? Math.max(0, Math.ceil((new Date(tradingAccount.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Selected team outcome and bet calculation preview
  const activePrice = selectedMarket ? (side === "yes" ? selectedMarket.yes_price : selectedMarket.no_price) : 0.5;
  const activeStake = customStake ? parseFloat(customStake) : stake;
  const previewShares = selectedMarket && activeStake > 0 ? Math.floor(activeStake / activePrice) : 0;
  const previewProfit = previewShares - activeStake;

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
                {tradingAccount.breach_reason || "This account has violated the challenge drawdown rules and is now locked."}
              </div>
            </div>
          </div>
        )}

        {tradingAccount?.status === "expired" && (
          <div className="breached-banner" style={{ backgroundColor: "rgba(107, 114, 128, 0.1)", borderColor: "rgba(107, 114, 128, 0.3)" }}>
            <span className="breached-banner__icon">⏳</span>
            <div>
              <div className="breached-banner__title" style={{ color: "#9ca3af" }}>Challenge Expired</div>
              <div className="breached-banner__desc">
                This challenge account has exceeded its duration limit and is closed for new trades.
              </div>
            </div>
          </div>
        )}

        {/* Top metrics dashboard */}
        {tradingAccount && (
          <div className="stats-card">
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-item__label">Cash Balance</div>
                <div className="metric-item__value">
                  ${tradingAccount.cash_balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Account Equity</div>
                <div className="metric-item__value" style={{ color: "#3b82f6" }}>
                  ${tradingAccount.equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Open Positions Value</div>
                <div className="metric-item__value" style={{ color: "#f59e0b" }}>
                  ${tradingAccount.open_positions_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Today's Realized P&L</div>
                <div className={`metric-item__value ${dailyStats && dailyStats.realized_pnl > 0 ? "metric-item__value--positive" : dailyStats && dailyStats.realized_pnl < 0 ? "metric-item__value--negative" : ""}`}>
                  {dailyStats && dailyStats.realized_pnl !== 0 
                    ? `${dailyStats.realized_pnl > 0 ? "+" : ""}$${dailyStats.realized_pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "$0.00"
                  }
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              <div className="rules-list">
                <div className="rule-progress">
                  <div className="rule-progress__header">
                    <span className="rule-progress__label">Total Drawdown Limit (Max -$10K)</span>
                    <span className="rule-progress__value">
                      ${totalDrawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} buffer
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
                    <span className="rule-progress__label">Daily Drawdown Limit (Max -$5K)</span>
                    <span className="rule-progress__value">
                      ${dailyDrawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} buffer
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

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px", borderLeft: "1px solid #1f2937", paddingLeft: "24px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase" }}>Time Remaining</span>
                  <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--font-heading)" }}>
                    {daysRemaining} <span style={{ fontSize: "16px", color: "#9ca3af" }}>Days</span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Active Challenge ends: {new Date(tradingAccount.expires_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content body split */}
        <div className="trading-grid">
          {/* Main markets column */}
          <div>
            <div className="admin-header-row">
              <h2 className="markets-section-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                World Cup Predictions
              </h2>
              <button onClick={handleForceSync} disabled={isSyncing} className="admin-sync-btn" style={{ fontSize: "12px", padding: "6px 14px" }}>
                {isSyncing ? "Syncing..." : "Sync Live Odds"}
              </button>
            </div>

            {loadingMarkets ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Loading Polymarket events...</div>
            ) : markets.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "8px" }}>
                No active markets in database. Please click "Sync Live Odds" above to pull them from Polymarket.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {markets.map((market) => (
                  <div 
                    key={market.polymarket_id} 
                    onClick={() => {
                      setSelectedMarket(market);
                      setTradingError(null);
                      setTradingSuccess(null);
                    }}
                    className="wc-card"
                    style={{ 
                      cursor: "pointer", 
                      border: selectedMarket?.polymarket_id === market.polymarket_id ? "1px solid #22c55e" : "1px solid #1f2937",
                      backgroundColor: selectedMarket?.polymarket_id === market.polymarket_id ? "rgba(34, 197, 94, 0.02)" : "",
                      transition: "all 0.2s"
                    }}
                  >
                    <div className="wc-card__header">
                      <span className="wc-card__label" style={{ textTransform: "capitalize" }}>
                        {market.event_slug.replace(/-/g, " ")}
                      </span>
                      <span className="wc-card__date">Active</span>
                    </div>

                    <div className="wc-card__title-row" style={{ paddingBottom: "12px", borderBottom: "1px solid #121824" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div>
                          <h3 className="wc-card__title" style={{ fontSize: "16px", fontWeight: "700" }}>{market.question}</h3>
                          {market.group_title && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0 0 0" }}>Option: {market.group_title}</p>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Yes Price</span>
                          <div style={{ fontSize: "15px", fontWeight: "bold", color: "#22c55e", marginTop: "2px" }}>
                            {(market.yes_price * 100).toFixed(0)}¢
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>No Price</span>
                          <div style={{ fontSize: "15px", fontWeight: "bold", color: "#ef4444", marginTop: "2px" }}>
                            {(market.no_price * 100).toFixed(0)}¢
                          </div>
                        </div>
                      </div>

                      <button 
                        className="admin-sync-btn"
                        style={{ 
                          fontSize: "12px", 
                          padding: "6px 12px",
                          backgroundColor: selectedMarket?.polymarket_id === market.polymarket_id ? "#22c55e" : "#1f2937" 
                        }}
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bet execution panel */}
          <div>
            <div className="stats-card" style={{ position: "sticky", top: "24px" }}>
              <h3 className="stats-card__title" style={{ marginBottom: "16px" }}>Place Order</h3>

              {selectedMarket ? (
                <form onSubmit={handlePlaceBet} className="auth-form">
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#d1d5db", marginBottom: "8px" }}>
                    {selectedMarket.question}
                  </div>

                  <div className="wc-field">
                    <span className="wc-field__label">Select Side</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSide("yes");
                          setTradingError(null);
                          setTradingSuccess(null);
                        }}
                        className={`wc-stake-option ${side === "yes" ? "wc-stake-option--active" : ""}`}
                        style={{ border: side === "yes" ? "1px solid #22c55e" : "1px solid #1f2937", backgroundColor: side === "yes" ? "rgba(34, 197, 94, 0.1)" : "" }}
                      >
                        YES ({(selectedMarket.yes_price * 100).toFixed(0)}¢)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSide("no");
                          setTradingError(null);
                          setTradingSuccess(null);
                        }}
                        className={`wc-stake-option ${side === "no" ? "wc-stake-option--active" : ""}`}
                        style={{ border: side === "no" ? "1px solid #ef4444" : "1px solid #1f2937", backgroundColor: side === "no" ? "rgba(239, 68, 68, 0.1)" : "" }}
                      >
                        NO ({(selectedMarket.no_price * 100).toFixed(0)}¢)
                      </button>
                    </div>
                  </div>

                  <div className="wc-field">
                    <span className="wc-field__label">Bet Stake Amount ($)</span>
                    <div className="wc-stake-options" role="group" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", margin: "8px 0" }}>
                      {STAKE_PRESETS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className={`wc-stake-option ${stake === amount && !customStake ? "wc-stake-option--active" : ""}`}
                          onClick={() => {
                            setStake(amount);
                            setCustomStake("");
                            setTradingError(null);
                            setTradingSuccess(null);
                          }}
                        >
                          +${amount.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      className="auth-input"
                      placeholder="Custom Amount ($)"
                      style={{ width: "100%", marginTop: "4px" }}
                      value={customStake}
                      onChange={(e) => {
                        setCustomStake(e.target.value);
                        setTradingError(null);
                        setTradingSuccess(null);
                      }}
                    />
                  </div>

                  {previewShares > 0 && (
                    <div className="wc-calculator__results" style={{ marginTop: "16px", padding: "14px", backgroundColor: "#121824", borderRadius: "8px", border: "1px solid #1f2937" }}>
                      <div className="wc-result-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Shares to Buy</div>
                          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", marginTop: "2px" }}>
                            {previewShares.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Total Profit If Wins</div>
                          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#22c55e", marginTop: "2px" }}>
                            ${previewProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tradingError && <div className="auth-alert auth-alert--error" style={{ margin: "12px 0 0 0" }}>{tradingError}</div>}
                  {tradingSuccess && <div className="auth-alert auth-alert--success" style={{ margin: "12px 0 0 0" }}>{tradingSuccess}</div>}

                  <button
                    type="submit"
                    disabled={executingTrade || !tradingAccount || tradingAccount.status !== "active"}
                    className="auth-button"
                    style={{ marginTop: "16px" }}
                  >
                    {executingTrade ? "Executing Trade..." : tradingAccount?.status !== "active" ? "Trading Disabled" : "Execute Bet"}
                  </button>
                </form>
              ) : (
                <div style={{ color: "#9ca3af", fontSize: "13px", padding: "16px 0", textAlign: "center" }}>
                  Select a market from the list to trade.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
