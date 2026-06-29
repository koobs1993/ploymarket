import { Link } from "react-router-dom";
import type { TradeEventSummary } from "../types";

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

function formatMatchDate(endDate: string): string {
  return new Date(endDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCatalog({
  events,
  matchLayout = false,
}: {
  events: TradeEventSummary[];
  matchLayout?: boolean;
}) {
  return (
    <div className="event-catalog">
      {events.map((event) => {
        const topOutcomes = event.outcomes.slice(0, 3);
        return (
          <Link
            key={event.slug}
            to={`/trade/${event.slug}`}
            className={`event-card ${matchLayout ? "event-card--match" : ""}`}
          >
            <div className="event-card__header">
              {event.icon && (
                <img src={event.icon} alt="" className="event-card__icon" />
              )}
              <div className="event-card__meta">
                <h3 className="event-card__title">{event.title}</h3>
                <div className="event-card__stats">
                  <span>{formatVolume(event.volume)} Vol.</span>
                  <span>•</span>
                  <span>
                    {matchLayout
                      ? formatMatchDate(event.endDate)
                      : new Date(event.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
  );
}
