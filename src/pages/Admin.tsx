import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";
import { syncMarkets, settleMarkets } from "../utils/syncMarkets";
import { formatDate } from "../utils/format";
import { formatMoney } from "../utils/profile";

interface AdminUser {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
  email: string;
}

interface TraderAccount {
  id: string;
  user_id: string;
  cash_balance: number;
  starting_balance: number;
  status: "active" | "breached" | "expired" | "closed";
  started_at: string;
  expires_at: string;
  breach_reason: string | null;
  equity?: number;
  open_positions_value?: number;
  profiles: {
    display_name: string;
    id: string;
    email?: string;
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [accounts, setAccounts] = useState<TraderAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TraderAccount | null>(null);
  const [selectedAccountPositions, setSelectedAccountPositions] = useState<TraderPosition[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminData();
    }
  }, [profile?.is_admin]);

  function isErrorMessage(message: string) {
    const lower = message.toLowerCase();
    return lower.includes("fail") || lower.includes("error");
  }

  async function fetchAdminData() {
    setLoadingAccounts(true);
    setActionMessage(null);
    try {
      const [{ data: userRows, error: usersError }, { data: accountRows, error: accountsError }] =
        await Promise.all([
          supabase.rpc("admin_list_users"),
          supabase
            .from("trading_accounts")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (usersError) throw usersError;
      if (accountsError) throw accountsError;

      const typedUsers = (userRows || []) as AdminUser[];
      setUsers(typedUsers);

      const userById = new Map(typedUsers.map((user) => [user.id, user]));

      const typedAccounts = await Promise.all(
        (accountRows || []).map(async (row) => {
          const user = userById.get(row.user_id);
          let equity = Number(row.cash_balance);
          let openPositionsValue = 0;

          const { data: statusData } = await supabase.rpc(
            "check_and_update_account_status",
            { p_account_id: row.id },
          );

          if (statusData && !statusData.error) {
            equity = Number(statusData.equity ?? row.cash_balance);
            openPositionsValue = Number(statusData.open_positions_value ?? 0);
          }

          return {
            ...row,
            cash_balance: Number(row.cash_balance),
            starting_balance: Number(row.starting_balance),
            equity,
            open_positions_value: openPositionsValue,
            status: (statusData?.status as TraderAccount["status"]) || row.status,
            breach_reason: statusData?.breach_reason || row.breach_reason,
            profiles: {
              id: row.user_id,
              display_name: user?.display_name || "Trader",
              email: user?.email,
            },
          } as TraderAccount;
        }),
      );

      setAccounts(typedAccounts);

      if (typedAccounts.length > 0) {
        const currentSelection = selectedAccount
          ? typedAccounts.find((acc) => acc.id === selectedAccount.id)
          : typedAccounts[0];
        if (currentSelection) {
          await handleSelectAccount(currentSelection);
        }
      } else {
        setSelectedAccount(null);
        setSelectedAccountPositions([]);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      setActionMessage(
        err instanceof Error
          ? `Failed to load admin data: ${err.message}`
          : "Failed to load admin data.",
      );
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

  async function runAdminAction(
    actionKey: string,
    rpcName: "admin_force_breach" | "admin_reset_balance" | "admin_clear_trades",
    params: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!selectedAccount) return;

    setActionLoading(actionKey);
    setActionMessage(null);
    try {
      const { data, error } = await supabase.rpc(rpcName, params);
      if (error) throw error;
      if (data?.success === false) {
        throw new Error("Admin action failed.");
      }

      setActionMessage(successMessage);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      setActionMessage(
        err instanceof Error ? `Action failed: ${err.message}` : "Action failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleForceBreach() {
    if (!selectedAccount) return;
    const reason =
      window.prompt(
        "Breach reason (optional):",
        "Force breached by administrator",
      ) ?? undefined;
    if (reason === undefined) return;

    if (
      !window.confirm(
        `Force breach ${selectedAccount.profiles.display_name}'s account? This locks trading immediately.`,
      )
    ) {
      return;
    }

    await runAdminAction(
      "breach",
      "admin_force_breach",
      {
        p_account_id: selectedAccount.id,
        p_reason: reason || "Force breached by administrator",
      },
      `Account for ${selectedAccount.profiles.display_name} was force breached.`,
    );
  }

  async function handleResetBalance() {
    if (!selectedAccount) return;

    if (
      !window.confirm(
        `Reset cash balance to $${formatMoney(selectedAccount.starting_balance)} and reactivate this account? Open positions will remain.`,
      )
    ) {
      return;
    }

    await runAdminAction(
      "reset",
      "admin_reset_balance",
      { p_account_id: selectedAccount.id },
      `Balance reset to $${formatMoney(selectedAccount.starting_balance)} for ${selectedAccount.profiles.display_name}.`,
    );
  }

  async function handleClearTrades() {
    if (!selectedAccount) return;

    if (
      !window.confirm(
        `Clear all trades, ledger history, and daily stats for ${selectedAccount.profiles.display_name}? Cash will reset to $${formatMoney(selectedAccount.starting_balance)}.`,
      )
    ) {
      return;
    }

    await runAdminAction(
      "clear",
      "admin_clear_trades",
      { p_account_id: selectedAccount.id },
      `All trades cleared for ${selectedAccount.profiles.display_name}.`,
    );
  }

  async function handleSyncNow() {
    setSyncLoading(true);
    setActionMessage(null);
    try {
      const res = await syncMarkets();
      if (res.success) {
        setActionMessage(`Successfully synced ${res.count} active Polymarket options!`);
        await fetchAdminData();
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
        setActionMessage(
          `Settlement checking complete. Settled positions count: ${res.settledCount}`,
        );
        await fetchAdminData();
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

  const accountsByUser = users.map((user) => ({
    user,
    accounts: accounts.filter((acc) => acc.user_id === user.id),
  }));

  if (!profile?.is_admin) {
    return (
      <div style={{ backgroundColor: "#040812", minHeight: "100vh", color: "#ffffff" }}>
        <TradeHeader />
        <div className="trade-container" style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: "40px" }}>⛔</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "16px" }}>Access Denied</h2>
          <p style={{ color: "#9ca3af", marginTop: "8px" }}>
            This area is reserved for GoatFunded platform administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#040812", minHeight: "100vh", color: "#ffffff" }}>
      <TradeHeader />

      <div className="trade-container">
        <div className="admin-header-row">
          <h2
            className="markets-section-title"
            style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}
          >
            GoatFunded World Cup Admin Panel
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={handleSyncNow} disabled={syncLoading} className="admin-sync-btn">
              {syncLoading ? "Syncing..." : "Force Sync Markets"}
            </button>
            <button
              onClick={handleSettleNow}
              disabled={settleLoading}
              className="admin-sync-btn"
              style={{ backgroundColor: "#f59e0b" }}
            >
              {settleLoading ? "Settling..." : "Check Position Settlement"}
            </button>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`auth-alert ${
              isErrorMessage(actionMessage) ? "auth-alert--error" : "auth-alert--success"
            }`}
            style={{ marginBottom: "24px" }}
          >
            {actionMessage}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          <div>
            <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>
              All Users
            </h3>
            {loadingAccounts ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#9ca3af",
                  border: "1px dashed #1f2937",
                  borderRadius: "8px",
                }}
              >
                No users found.
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  backgroundColor: "#0b0f19",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Accounts</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountsByUser.map(({ user, accounts: userAccounts }) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: "700" }}>{user.display_name}</td>
                        <td>{user.email}</td>
                        <td>{user.is_admin ? "Administrator" : "Trader"}</td>
                        <td>{userAccounts.length}</td>
                        <td>{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>
              Challenge Accounts
            </h3>
            {loadingAccounts ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#9ca3af",
                  border: "1px dashed #1f2937",
                  borderRadius: "8px",
                }}
              >
                No trader challenge accounts found in database.
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  backgroundColor: "#0b0f19",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Trader</th>
                      <th>Email</th>
                      <th>Cash</th>
                      <th>Equity</th>
                      <th>Starting</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => (
                      <tr
                        key={acc.id}
                        style={{
                          backgroundColor:
                            selectedAccount?.id === acc.id
                              ? "rgba(255, 193, 69, 0.05)"
                              : "",
                          borderLeft:
                            selectedAccount?.id === acc.id
                              ? "3px solid var(--gold, #ffc145)"
                              : "3px solid transparent",
                        }}
                      >
                        <td style={{ fontWeight: "700" }}>
                          {acc.profiles?.display_name || "Trader"}
                        </td>
                        <td>{acc.profiles?.email || "—"}</td>
                        <td>${formatMoney(acc.cash_balance)}</td>
                        <td>${formatMoney(acc.equity ?? acc.cash_balance)}</td>
                        <td>${formatMoney(acc.starting_balance)}</td>
                        <td>
                          <span className={`trade-account-status trade-account-status--${acc.status}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td>{formatDate(acc.expires_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-sync-btn"
                            style={{ fontSize: "11px", padding: "4px 8px", backgroundColor: "#1f2937" }}
                            onClick={() => handleSelectAccount(acc)}
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

          {selectedAccount && (
            <div className="stats-card">
              <div className="admin-detail-header">
                <div>
                  <h3
                    className="stats-card__title"
                    style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "6px" }}
                  >
                    {selectedAccount.profiles?.display_name || "Trader"}
                  </h3>
                  <p className="admin-detail-subtitle">
                    {selectedAccount.profiles?.email || "No email"} ·{" "}
                    {selectedAccount.id.slice(0, 8)}…
                  </p>
                </div>
                <div className="admin-action-buttons">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--danger"
                    disabled={actionLoading !== null || selectedAccount.status === "breached"}
                    onClick={handleForceBreach}
                  >
                    {actionLoading === "breach" ? "Breaching..." : "Force Breach"}
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--warning"
                    disabled={actionLoading !== null}
                    onClick={handleResetBalance}
                  >
                    {actionLoading === "reset" ? "Resetting..." : "Reset Balance"}
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--neutral"
                    disabled={actionLoading !== null}
                    onClick={handleClearTrades}
                  >
                    {actionLoading === "clear" ? "Clearing..." : "Clear Trades"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  margin: "16px 0 24px 0",
                }}
              >
                <div className="admin-metric">
                  <div className="admin-metric__label">Cash Balance</div>
                  <div className="admin-metric__value">
                    ${formatMoney(selectedAccount.cash_balance)}
                  </div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric__label">Equity</div>
                  <div className="admin-metric__value">
                    ${formatMoney(selectedAccount.equity ?? selectedAccount.cash_balance)}
                  </div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric__label">Open Positions</div>
                  <div className="admin-metric__value">
                    ${formatMoney(selectedAccount.open_positions_value ?? 0)}
                  </div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric__label">Current Status</div>
                  <div className="admin-metric__value" style={{ textTransform: "capitalize" }}>
                    {selectedAccount.status}
                  </div>
                </div>
              </div>

              {selectedAccount.breach_reason && (
                <div className="admin-breach-banner">
                  <div className="admin-breach-banner__label">Breach Reason</div>
                  <div>{selectedAccount.breach_reason}</div>
                </div>
              )}

              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px" }}>
                Trader Positions ({selectedAccountPositions.length})
              </h4>
              {loadingPositions ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                  Loading positions...
                </div>
              ) : selectedAccountPositions.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#9ca3af",
                    border: "1px dashed #1f2937",
                    borderRadius: "6px",
                  }}
                >
                  This trader has placed no predictions.
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    border: "1px solid #1f2937",
                    borderRadius: "6px",
                    backgroundColor: "#121824",
                  }}
                >
                  <table className="positions-table" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th>Market Question</th>
                        <th>Side</th>
                        <th>Shares</th>
                        <th>Entry Price</th>
                        <th>Cost</th>
                        <th>Payout</th>
                        <th>Opened</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccountPositions.map((pos) => (
                        <tr key={pos.id} className="position-row">
                          <td style={{ fontWeight: "600" }}>{pos.markets?.question}</td>
                          <td
                            style={{
                              fontWeight: "bold",
                              color: pos.side === "yes" ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {pos.side.toUpperCase()}
                          </td>
                          <td>{pos.shares.toLocaleString()}</td>
                          <td>{(pos.entry_price * 100).toFixed(0)}¢</td>
                          <td>${formatMoney(pos.cost)}</td>
                          <td>${formatMoney(pos.payout)}</td>
                          <td>{formatDate(pos.created_at)}</td>
                          <td>
                            <span className={`status-badge status-badge--${pos.status}`}>
                              {pos.status}
                            </span>
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
