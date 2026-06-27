import { leaderboardPrizes, prizeTotals } from "../../data/landingContent";

export function PrizeLeaderboard() {
  return (
    <div className="prize-leaderboard">
      <h3 className="prize-leaderboard__title">More places. More funding.</h3>
      <div className="prize-leaderboard__list">
        {leaderboardPrizes.map((row) => (
          <div key={row.rank} className="prize-leaderboard__row">
            <span className="prize-leaderboard__rank">{row.rank}</span>
            <span className="prize-leaderboard__cash">{row.cash}</span>
            <span className="prize-leaderboard__account">{row.account}</span>
          </div>
        ))}
      </div>
      <dl className="prize-leaderboard__totals">
        {prizeTotals.map((item) => (
          <div
            key={item.label}
            className={`prize-leaderboard__total${item.featured ? " prize-leaderboard__total--featured" : ""}`}
          >
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
