import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";
import { syncMarkets, settleMarkets } from "../utils/syncMarkets";

interface TraderAccount {
  id: string;
  user_id: string;
  cash_balance: number;
  starting_balance: number;
  status: "active" | "breached" | "expired" | "closed";
  started_at: string;
  expires_at: string;
  breach_reason: string | null;
  profiles: {
    display_name: string;
    id: string;
  };
}

interface TraderPosition {
  id: string;
  side: string;
  shares: number;
  entry_price: number;
  cost: number;
  status: string;
  payout: number;
  created_at: string;
  markets: {
    question: string;
  };
}

export function AdminPage() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<TraderAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TraderAccount | null>(null);
  const [selectedAccountPositions, setSelectedAccountPositions] = useState<TraderPosition[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchTraderAccounts();
    }
  }, [profile?.is_admin]);

  async function fetchTraderAccounts() {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select(`
          *,
          profiles (
            display_name,
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const typedAccounts = (data || []) as unknown as TraderAccount[];
      setAccounts(typedAccounts);
      if (typedAccounts.length > 0 && !selectedAccount) {
        handleSelectAccount(typedAccounts[0]);
      }
    } catch (err) {
      console.error("Error loading trader accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleSelectAccount(account: TraderAccount) {
    setSelectedAccount(account);
    setLoadingPositions(true);
    try {
      const { data, error } = await supabase
        .from("positions")
        .select(`
          *,
          markets (
            question
          )
        `)
        .eq("account_id", account.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSelectedAccountPositions((data || []) as unknown as TraderPosition[]);
    } catch (err) {
      console.error("Error loading positions for trader:", err);
    } finally {
      setLoadingPositions(false);
    }
  }

  async function handleSyncNow() {
    setSyncLoading(true);
    setActionMessage(null);
    try {
      const res = await syncMarkets();
      if (res.success) {
        setActionMessage(`Successfully synced ${res.count} active Polymarket options!`);
        await fetchTraderAccounts();
        if (selectedAccount) {
          await handleSelectAccount(selectedAccount);
        }
      } else {
        setActionMessage(`Sync failed: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      setActionMessage("Sync error occurred.");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleSettleNow() {
    setSettleLoading(true);
    setActionMessage(null);
    try {
      const res = await settleMarkets();
      if (res.success) {
        setActionMessage(`Settlement checking complete. Settled positions count: ${res.settledCount}`);
        await fetchTraderAccounts();
        if (selectedAccount) {
          await handleSelectAccount(selectedAccount);
        }
      } else {
        setActionMessage(`Settlement checking failed: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      setActionMessage("Settlement check error occurred.");
    } finally {
      setSettleLoading(false);
    }
  }

  if (!profile?.is_admin) {
    return (
      <div style={{ backgroundColor: "#040812", minHeight: "100vh", color: "#ffffff" }}>
        <TradeHeader />
        <div className="trade-container" style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: "40px" }}>⛔</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "16px" }}>Access Denied</h2>
          <p style={{ color: "#9ca3af", marginTop: "8px" }}>This area is reserved for GoatFunded platform administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#040812", minHeight: "100vh", color: "#ffffff" }}>
      <TradeHeader />

      <div className="trade-container">
        <div className="admin-header-row">
          <h2 className="markets-section-title" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
            GoatFunded World Cup Admin Panel
          </h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleSyncNow} disabled={syncLoading} className="admin-sync-btn">
              {syncLoading ? "Syncing..." : "Force Sync Markets"}
            </button>
            <button onClick={handleSettleNow} disabled={settleLoading} className="admin-sync-btn" style={{ backgroundColor: "#f59e0b" }}>
              {settleLoading ? "Settling..." : "Check Position Settlement"}
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="auth-alert auth-alert--success" style={{ marginBottom: "24px" }}>
            {actionMessage}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          {/* Trader Accounts table */}
          <div>
            <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>Trader Accounts</h3>
            {loadingAccounts ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "8px" }}>
                No trader challenge accounts found in database.
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: "8px", backgroundColor: "#0b0f19" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Trader Name</th>
                      <th>Account ID</th>
                      <th>Cash Balance</th>
                      <th>Starting Balance</th>
                      <th>Expires At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => (
                      <tr 
                        key={acc.id} 
                        onClick={() => handleSelectAccount(acc)}
                        style={{ 
                          cursor: "pointer",
                          backgroundColor: selectedAccount?.id === acc.id ? "rgba(59, 130, 246, 0.05)" : "",
                          borderLeft: selectedAccount?.id === acc.id ? "3px solid #3b82f6" : "3px solid transparent"
                        }}
                      >
                        <td style={{ fontWeight: "700" }}>{acc.profiles?.display_name || "Trader"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" }}>{acc.id}</td>
                        <td>${acc.cash_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td>${acc.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td>{new Date(acc.expires_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`trade-account-status trade-account-status--${acc.status}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="admin-sync-btn" 
                            style={{ fontSize: "11px", padding: "4px 8px", backgroundColor: "#1f2937" }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Detailed inspection panel */}
          {selectedAccount && (
            <div className="stats-card">
              <h3 className="stats-card__title" style={{ borderBottom: "1px solid #1f2937", paddingBottom: "12px" }}>
                Inspecting: {selectedAccount.profiles?.display_name || "Trader"}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", margin: "16px 0 24px 0" }}>
                <div style={{ backgroundColor: "#121824", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Cash Balance</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                    ${selectedAccount.cash_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: "#121824", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Challenge Progress</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                    {selectedAccount.status === "active" ? "Active" : selectedAccount.status === "breached" ? "BREACHED" : "Expired"}
                  </div>
                </div>
                {selectedAccount.breach_reason && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "12px", borderRadius: "6px", gridColumn: "span 2", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                    <div style={{ fontSize: "11px", color: "#ef4444", textTransform: "uppercase", fontWeight: "bold" }}>Breach Violation Reason</div>
                    <div style={{ fontSize: "13px", color: "#ef4444", marginTop: "4px", lineHeight: "1.4" }}>
                      {selectedAccount.breach_reason}
                    </div>
                  </div>
                )}
              </div>

              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px" }}>Trader Positions ({selectedAccountPositions.length})</h4>
              {loadingPositions ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>Loading positions...</div>
              ) : selectedAccountPositions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "6px" }}>
                  This trader has placed no predictions.
                </div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: "6px", backgroundColor: "#121824" }}>
                  <table className="positions-table" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th>Market Question</th>
                        <th>Side</th>
                        <th>Shares</th>
                        <th>Entry Price</th>
                        <th>Cost</th>
                        <th>Payout</th>
                        <th>Settled At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccountPositions.map((pos) => (
                        <tr key={pos.id} className="position-row">
                          <td style={{ fontWeight: "600" }}>{pos.markets?.question}</td>
                          <td style={{ fontWeight: "bold", color: pos.side === "yes" ? "#22c55e" : "#ef4444" }}>{pos.side.toUpperCase()}</td>
                          <td>{pos.shares.toLocaleString()}</td>
                          <td>{(pos.entry_price * 100).toFixed(0)}¢</td>
                          <td>${pos.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td>${pos.payout.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td>{pos.created_at ? new Date(pos.created_at).toLocaleDateString() : "-"}</td>
                          <td>
                            <span className={`status-badge status-badge--${pos.status}`}>{pos.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
