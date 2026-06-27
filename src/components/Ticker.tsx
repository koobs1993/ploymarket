import { useWorldCup } from "../hooks/useWorldCupData";
import type { TickerItem } from "../types";
import { TickerItemRow } from "./TickerItem";

export function Ticker() {
  const { data, error, loading } = useWorldCup();

  if (error && !data) {
    return <div className="ticker ticker--error">{error}</div>;
  }

  if (loading || !data) {
    return <div className="ticker ticker--loading">Loading markets…</div>;
  }

  const items: TickerItem[] = data.outcomes.map((outcome) => ({
    id: outcome.id,
    title: outcome.title,
    icon: outcome.icon,
    odds: outcome.odds,
    change: outcome.change,
  }));

  const loop = [...items, ...items];

  return (
    <div className="ticker" aria-label="Polymarket odds ticker">
      <div className="ticker__track">
        {loop.map((item, index) => (
          <TickerItemRow key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
