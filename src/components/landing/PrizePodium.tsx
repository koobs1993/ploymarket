import { podiumPrizes } from "../../data/landingContent";

export function PrizePodium() {
  return (
    <div className="podium">
      {podiumPrizes.map((prize) => (
        <article
          key={prize.place}
          className={`podium-card podium-card--${prize.tone}${prize.featured ? " podium-card--featured" : ""}`}
        >
          {prize.placeImage ? (
            <img
              className="podium-card__place-icon"
              src={prize.placeImage}
              alt=""
              loading="lazy"
            />
          ) : (
            <span className="podium-card__place">{prize.place}</span>
          )}
          <span className="podium-card__rank">{prize.rank}</span>
          <span className="podium-card__cash">{prize.cash}</span>
          <span className="podium-card__account">+ {prize.account}</span>
        </article>
      ))}
    </div>
  );
}
