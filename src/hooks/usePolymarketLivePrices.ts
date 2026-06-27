import { useEffect, useState } from "react";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const PING_MS = 10_000;
const RECONNECT_MS = 3_000;

interface MarketMessage {
  event_type?: string;
  asset_id?: string;
  best_bid?: string;
  best_ask?: string;
  price?: string;
  price_changes?: Array<{
    asset_id?: string;
    best_bid?: string;
    best_ask?: string;
  }>;
}

function midpoint(bid: number, ask: number): number | null {
  if (Number.isNaN(bid) || Number.isNaN(ask) || bid <= 0 || ask <= 0) {
    return null;
  }
  return (bid + ask) / 2;
}

function applyMessage(
  message: MarketMessage,
  update: (assetId: string, price: number) => void,
) {
  switch (message.event_type) {
    case "best_bid_ask":
      if (!message.asset_id) return;
      {
        const price = midpoint(
          parseFloat(message.best_bid ?? ""),
          parseFloat(message.best_ask ?? ""),
        );
        if (price !== null) update(message.asset_id, price);
      }
      return;

    case "last_trade_price":
      if (!message.asset_id) return;
      {
        const price = parseFloat(message.price ?? "");
        if (!Number.isNaN(price) && price > 0) {
          update(message.asset_id, price);
        }
      }
      return;

    case "price_change":
      for (const change of message.price_changes ?? []) {
        if (!change.asset_id) continue;
        const price = midpoint(
          parseFloat(change.best_bid ?? ""),
          parseFloat(change.best_ask ?? ""),
        );
        if (price !== null) update(change.asset_id, price);
      }
  }
}

export function usePolymarketLivePrices(tokenIds: string[]) {
  const [prices, setPrices] = useState<Map<string, number>>(() => new Map());
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const tokenKey = tokenIds.join("|");

  useEffect(() => {
    if (tokenIds.length === 0) return;

    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function updatePrice(assetId: string, price: number) {
      setPrices((current) => {
        const next = new Map(current);
        next.set(assetId, price);
        return next;
      });
      setLastUpdate(Date.now());
    }

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        ws?.send(
          JSON.stringify({
            type: "market",
            assets_ids: tokenIds,
            custom_feature_enabled: true,
          }),
        );
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send("PING");
          }
        }, PING_MS);
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string" || event.data === "PONG") return;
        try {
          applyMessage(JSON.parse(event.data) as MarketMessage, updatePrice);
        } catch {
          // Ignore malformed websocket payloads.
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingTimer) clearInterval(pingTimer);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, RECONNECT_MS);
        }
      };

      ws.onerror = () => ws?.close();
    }

    connect();

    return () => {
      cancelled = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [tokenKey]);

  return { prices, connected, lastUpdate };
}
