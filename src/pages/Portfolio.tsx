import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { supabase } from "../lib/supabase";

interface Position {
  id: string;
  market_id: string;
  side: "yes" | "no";
  shares: number;
  entry_price: number;
  cost: number;
  status: "open" | "won" | "lost" | "void";
  payout: number;
  created_at: string;
  settled_at: string | null;
  markets: {
    question: string;
    yes_price: number;
    no_price: number;
    closed: boolean;
  };
}

interface LedgerEntry {
  id: string;
  type: "initial_funding" | "bet_cost" | "settlement_payout" | "breach";
  amount: number;
  balance_after: number;
  created_at: string;
  metadata: any;
}

export function PortfolioPage() {
  const { tradingAccount } = useAuth();
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tradingAccount) {
      fetchPortfolioData();
    }
  }, [tradingAccount?.id]);

  async function fetchPortfolioData() {
    if (!tradingAccount) return;
    try {
      // 1. Fetch Positions
      const { data: positionsData, error: posError } = await supabase
        .from("positions")
        .select(`
          *,
          markets (
            question,
            yes_price,
            no_price,
            closed
          )
        `)
        .eq("account_id", tradingAccount.id)
        .order("created_at", { ascending: false });

      if (posError) throw posError;

      const typedPositions = (positionsData || []) as unknown as Position[];
      setOpenPositions(typedPositions.filter((p) => p.status === "open"));
      setClosedPositions(typedPositions.filter((p) => p.status !== "open"));

      // 2. Fetch Ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from("ledger_entries")
        .select("*")
        .eq("account_id", tradingAccount.id)
        .order("created_at", { ascending: false });

      if (ledgerError) throw ledgerError;
      setLedger(ledgerData || []);

    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#040812", minHeight: "100vh", color: "#ffffff" }}>
      <TradeHeader />

      <div className="trade-container">
        <h2 className="markets-section-title">Trader Portfolio</h2>

        {tradingAccount && (
          <div className="stats-card">
            <div className="metrics-grid" style={{ marginBottom: 0 }}>
              <div className="metric-item">
                <div className="metric-item__label">Cash Balance</div>
                <div className="metric-item__value">
                  ${tradingAccount.cash_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Total Equity</div>
                <div className="metric-item__value" style={{ color: "#3b82f6" }}>
                  ${tradingAccount.equity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Open Positions value</div>
                <div className="metric-item__value" style={{ color: "#f59e0b" }}>
                  ${tradingAccount.open_positions_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-item__label">Total Challenge Profit</div>
                <div className={`metric-item__value ${(tradingAccount.equity - tradingAccount.starting_balance) >= 0 ? "metric-item__value--positive" : "metric-item__value--negative"}`}>
                  ${(tradingAccount.equity - tradingAccount.starting_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>Loading portfolio...</div>
        ) : !tradingAccount ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "8px" }}>
            No challenge account found. Please sign up or contact admin.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Open Positions Section */}
            <div>
              <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>Open Positions</h3>
              {openPositions.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "8px" }}>
                  You have no active open positions. Go to the trade tab to make predictions.
                </div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: "8px", backgroundColor: "#0b0f19" }}>
                  <table className="positions-table">
                    <thead>
                      <tr>
                        <th>Market Prediction</th>
                        <th>Side</th>
                        <th>Shares</th>
                        <th>Entry Price</th>
                        <th>Entry Cost</th>
                        <th>Current Price</th>
                        <th>Current Value</th>
                        <th>Unrealized P&L</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openPositions.map((pos) => {
                        const curPrice = pos.side === "yes" ? pos.markets.yes_price : pos.markets.no_price;
                        const curVal = pos.shares * curPrice;
                        const uPnl = curVal - pos.cost;

                        return (
                          <tr key={pos.id} className="position-row">
                            <td style={{ fontWeight: "600" }}>{pos.markets?.question}</td>
                            <td>
                              <span style={{ 
                                fontWeight: "bold", 
                                color: pos.side === "yes" ? "#22c55e" : "#ef4444",
                                textTransform: "uppercase" 
                              }}>
                                {pos.side}
                              </span>
                            </td>
                            <td>{pos.shares.toLocaleString()}</td>
                            <td>{(pos.entry_price * 100).toFixed(0)}¢</td>
                            <td>${pos.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td>{(curPrice * 100).toFixed(0)}¢</td>
                            <td>${curVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td style={{ 
                              fontWeight: "600", 
                              color: uPnl >= 0 ? "#22c55e" : "#ef4444" 
                            }}>
                              {uPnl >= 0 ? "+" : ""}${uPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              <span className="status-badge status-badge--open">open</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Closed Positions Section */}
            <div>
              <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>Closed / Settled Positions</h3>
              {closedPositions.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", border: "1px dashed #1f2937", borderRadius: "8px" }}>
                  No settled predictions yet. Winning bets pay out $1.00 per share at Polymarket resolution.
                </div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: "8px", backgroundColor: "#0b0f19" }}>
                  <table className="positions-table">
                    <thead>
                      <tr>
                        <th>Market Prediction</th>
                        <th>Side</th>
                        <th>Shares</th>
                        <th>Entry Price</th>
                        <th>Cost</th>
                        <th>Payout</th>
                        <th>Realized P&L</th>
                        <th>Settle Date</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedPositions.map((pos) => {
                        const rPnl = pos.payout - pos.cost;
                        return (
                          <tr key={pos.id} className="position-row">
                            <td style={{ fontWeight: "600" }}>{pos.markets?.question}</td>
                            <td>
                              <span style={{ 
                                fontWeight: "bold", 
                                color: pos.side === "yes" ? "#22c55e" : "#ef4444",
                                textTransform: "uppercase" 
                              }}>
                                {pos.side}
                              </span>
                            </td>
                            <td>{pos.shares.toLocaleString()}</td>
                            <td>{(pos.entry_price * 100).toFixed(0)}¢</td>
                            <td>${pos.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td style={{ color: pos.payout > 0 ? "#22c55e" : "#ef4444", fontWeight: "600" }}>
                              ${pos.payout.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ 
                              fontWeight: "600", 
                              color: rPnl >= 0 ? "#22c55e" : "#ef4444" 
                            }}>
                              {rPnl >= 0 ? "+" : ""}${rPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td>{pos.settled_at ? new Date(pos.settled_at).toLocaleDateString() : "-"}</td>
                            <td>
                              <span className={`status-badge status-badge--${pos.status}`}>{pos.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Account Audit Ledger */}
            <div>
              <h3 className="stats-card__title" style={{ fontSize: "18px", marginBottom: "14px" }}>Account Ledger & Audit Trail</h3>
              <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: "8px", backgroundColor: "#0b0f19" }}>
                <table className="positions-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Account Balance After</th>
                      <th>Timestamp</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr key={entry.id} className="position-row">
                        <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" }}>{entry.id.slice(0, 8)}...</td>
                        <td style={{ fontWeight: "600", textTransform: "capitalize" }}>
                          {entry.type.replace(/_/g, " ")}
                        </td>
                        <td style={{ 
                          fontWeight: "bold", 
                          color: entry.amount > 0 ? "#22c55e" : entry.amount < 0 ? "#ef4444" : "#ffffff" 
                        }}>
                          {entry.amount > 0 ? "+" : ""}${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td>${entry.balance_after.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td>{new Date(entry.created_at).toLocaleString()}</td>
                        <td style={{ fontSize: "12px", color: "#9ca3af" }}>
                          {entry.type === "initial_funding" && "Simulated capital balance loaded"}
                          {entry.type === "bet_cost" && "Stake cost for prediction bet"}
                          {entry.type === "settlement_payout" && `Payout from Polymarket settlement`}
                          {entry.type === "breach" && `${entry.metadata?.reason || "drawdown breach registered"}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
