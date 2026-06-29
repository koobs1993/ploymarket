import { useEffect, useState } from "react";
import { fetchEventBySlug, fetchWorldCupMatchEvents } from "../api";
import { TRADE_EVENT_SLUGS } from "../constants/markets";
import { useAuth } from "../context/AuthContext";
import { EventCatalog } from "../components/EventCatalog";
import { TradeHeader } from "../components/TradeHeader";
import type { TradeEventSummary } from "../types";

export function TradePage() {
  const { tradingAccount } = useAuth();
  const [futuresEvents, setFuturesEvents] = useState<TradeEventSummary[]>([]);
  const [matchEvents, setMatchEvents] = useState<TradeEventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoadingEvents(true);
      setLoadError(null);
      try {
        const [futures, matches] = await Promise.all([
          Promise.all(
            TRADE_EVENT_SLUGS.map(async (slug) => {
              const data = await fetchEventBySlug(slug);
              return {
                slug,
                title: data.title,
                endDate: data.endDate,
                icon: data.icon,
                volume: data.volume,
                description: data.description,
                outcomes: data.outcomes,
              };
            }),
          ),
          fetchWorldCupMatchEvents(),
        ]);
        if (!cancelled) {
          setFuturesEvents(futures);
          setMatchEvents(matches);
        }
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

  return (
    <div className="trade-app" style={{ backgroundColor: "#040812", minHeight: "100vh" }}>
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

        <div>
          <h2 className="markets-section-title">World Cup Matches</h2>
          <p className="markets-section-desc">
            Individual FIFA World Cup games with live win and draw markets from
            Polymarket.
          </p>

          {loadingEvents ? (
            <div className="markets-loading">Loading markets from Polymarket…</div>
          ) : loadError ? (
            <div className="auth-alert auth-alert--error">{loadError}</div>
          ) : matchEvents.length === 0 ? (
            <div className="markets-empty">
              No upcoming World Cup match markets are open right now.
            </div>
          ) : (
            <EventCatalog events={matchEvents} matchLayout />
          )}

          <h2 className="markets-section-title" style={{ marginTop: "40px" }}>
            Futures & Special Markets
          </h2>
          <p className="markets-section-desc">
            Tournament winners, awards, and other World Cup futures.
          </p>

          {loadingEvents ? (
            <div className="markets-loading">Loading markets from Polymarket…</div>
          ) : loadError ? null : (
            <EventCatalog events={futuresEvents} />
          )}
        </div>
      </div>
    </div>
  );
}
