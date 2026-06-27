import type { TickerItem } from "../types";

interface TickerItemProps {
  item: TickerItem;
}

export function TickerItemRow({ item }: TickerItemProps) {
  const changeClass =
    item.change > 0 ? "up" : item.change < 0 ? "down" : "flat";

  const changeLabel =
    item.change > 0
      ? `+${item.change.toFixed(1)}%`
      : `${item.change.toFixed(1)}%`;

  return (
    <div className="ticker-item">
      <img
        className="ticker-item__icon"
        src={item.icon}
        alt=""
        loading="lazy"
      />
      <div className="ticker-item__body">
        <span className="ticker-item__title">{item.title}</span>
        <span className="ticker-item__stats">
          <span className="ticker-item__odds">{formatOdds(item.odds)}</span>
          <span className={`ticker-item__change ticker-item__change--${changeClass}`}>
            {changeLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

function formatOdds(odds: number): string {
  if (odds >= 99.95) return "100%";
  if (odds < 1) return `${odds.toFixed(1)}%`;
  return `${Math.round(odds)}%`;
}
