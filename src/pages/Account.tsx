import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/format";
import { formatMoney } from "../utils/profile";

interface DailyStats {
  opening_equity: number;
  lowest_equity: number;
  realized_pnl: number;
}

interface UserAccount {
  id: string;
  cash_balance: number;
  starting_balance: number;
  status: "active" | "breached" | "expired" | "closed";
  started_at: string;
  expires_at: string;
  breached_at: string | null;
  breach_reason: string | null;
  created_at: string;
}

export function AccountPage() {
  const { tradingAccount } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tradingAccount) {
      fetchAccountData();
    } else {
      setLoading(false);
    }
  }, [tradingAccount?.id]);

  async function fetchAccountData() {
    if (!tradingAccount) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [statsResult, accountsResult] = await Promise.all([
        supabase
          .from("account_daily_stats")
          .select("*")
          .eq("account_id", tradingAccount.id)
          .eq("date", todayStr)
          .maybeSingle(),
        supabase
          .from("trading_accounts")
          .select("*")
          .eq("user_id", tradingAccount.user_id)
          .order("created_at", { ascending: false }),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (accountsResult.error) throw accountsResult.error;

      if (statsResult.data) {
        setDailyStats({
          opening_equity: Number(statsResult.data.opening_equity),
          lowest_equity: Number(statsResult.data.lowest_equity),
          realized_pnl: Number(statsResult.data.realized_pnl),
        });
      } else {
        setDailyStats(null);
      }

      setAccounts(
        (accountsResult.data || []).map((row) => ({
          ...row,
          cash_balance: Number(row.cash_balance),
          starting_balance: Number(row.starting_balance),
        })),
      );
    } catch (err) {
      console.error("Error loading account data:", err);
    } finally {
      setLoading(false);
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
    <div className="trade-app" style={{ backgroundColor: "#040812", minHeight: "100vh" }}>
      <TradeHeader />

      <div className="trade-container">
        <h2 className="markets-section-title">Challenge Account</h2>
        <p className="markets-section-desc">
          Current account status, drawdown rules, and challenge details.
        </p>

        {loading ? (
          <div className="markets-loading">Loading account details…</div>
        ) : !tradingAccount ? (
          <div className="markets-empty">
            No challenge account found. Please sign up or contact admin.
          </div>
        ) : (
          <>
            {tradingAccount.status === "breached" && (
              <div className="breached-banner" style={{ marginBottom: "24px" }}>
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

            {tradingAccount.status === "expired" && (
              <div
                className="breached-banner"
                style={{
                  marginBottom: "24px",
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

            <div className="stats-card">
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-item__label">Cash Balance</div>
                  <div className="metric-item__value">
                    ${formatMoney(tradingAccount.cash_balance)}
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-item__label">Account Equity</div>
                  <div className="metric-item__value" style={{ color: "#3b82f6" }}>
                    ${formatMoney(tradingAccount.equity)}
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-item__label">Open Positions Value</div>
                  <div className="metric-item__value" style={{ color: "#f59e0b" }}>
                    ${formatMoney(tradingAccount.open_positions_value)}
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-item__label">Today's Realized P&L</div>
                  <div
                    className={`metric-item__value ${dailyStats && dailyStats.realized_pnl > 0 ? "metric-item__value--positive" : dailyStats && dailyStats.realized_pnl < 0 ? "metric-item__value--negative" : ""}`}
                  >
                    {dailyStats && dailyStats.realized_pnl !== 0
                      ? `${dailyStats.realized_pnl > 0 ? "+" : ""}$${formatMoney(dailyStats.realized_pnl)}`
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
                        ${totalDrawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
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
                        ${dailyDrawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
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

                <div className="account-time-remaining">
                  <div>
                    <span className="account-time-remaining__label">Time Remaining</span>
                    <div className="account-time-remaining__value">
                      {daysRemaining}{" "}
                      <span className="account-time-remaining__unit">Days</span>
                    </div>
                  </div>
                  <div className="account-time-remaining__meta">
                    Active Challenge ends: {formatDate(tradingAccount.expires_at)}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="stats-card__title" style={{ fontSize: "18px", margin: "32px 0 14px" }}>
              Account Details
            </h3>
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #1f2937",
                borderRadius: "8px",
                backgroundColor: "#0b0f19",
              }}
            >
              <table className="positions-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Status</th>
                    <th>Starting Balance</th>
                    <th>Cash Balance</th>
                    <th>Started</th>
                    <th>Expires</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className={`position-row ${account.id === tradingAccount.id ? "account-row--active" : ""}`}
                    >
                      <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                        {account.id.slice(0, 8)}…
                        {account.id === tradingAccount.id && (
                          <span className="account-row__badge">Current</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-badge--${account.status}`}>
                          {account.status}
                        </span>
                      </td>
                      <td>${formatMoney(account.starting_balance)}</td>
                      <td>${formatMoney(account.cash_balance)}</td>
                      <td>{formatDate(account.started_at)}</td>
                      <td>{formatDate(account.expires_at)}</td>
                      <td style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {account.breach_reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
