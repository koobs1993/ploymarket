import { JoinButton } from "./JoinButton";
import { Countdown } from "./Countdown";
import { Marquee } from "./Marquee";
import { WorldCupHero } from "../WorldCupHero";
import { WorldCupPanel } from "../WorldCupPanel";
import {
  TOURNAMENT_START,
  faqs,
  featurePills,
  heroStats,
  howItWorks,
  phases,
  podiumPrizes,
  rewardTiers,
  tradeifyPoints,
} from "../../data/landingContent";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      {eyebrow && <span className="section-heading__eyebrow">{eyebrow}</span>}
      <h2 className="section-heading__title">{title}</h2>
      {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="container landing-nav__inner">
          <div className="landing-nav__brand">
            <span className="landing-nav__logo">⚽</span>
            <span>Tradeify World Cup</span>
          </div>
          <JoinButton size="md" />
        </div>
      </header>

      <section className="landing-hero" id="join">
        <div className="container landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">Tradeify Prediction World Cup</p>
            <h1 className="landing-hero__title">
              Predict the World Cup Knockouts.{" "}
              <span className="text-accent">Win $100,000.</span>
            </h1>
            <p className="landing-hero__desc">
              Enter free, start with $2,000 in virtual capital, and trade World
              Cup prediction markets against thousands of other competitors. Top
              500 traders earn rewards.
            </p>

            <div className="stat-grid">
              {heroStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <span className="stat-card__value">{stat.value}</span>
                  <span className="stat-card__label">{stat.label}</span>
                </div>
              ))}
            </div>

            <JoinButton size="lg" />

            <p className="landing-hero__trust">
              Trusted by Kane, Rips, Rake and 50k other traders
            </p>
          </div>

          <div className="landing-hero__visual">
            <div className="visual-card">
              <div className="visual-card__badge">Live odds</div>
              <WorldCupHero compact />
            </div>
          </div>
        </div>
      </section>

      <Marquee items={featurePills} className="marquee--accent" />

      <section className="landing-section landing-section--live">
        <div className="container">
          <SectionHeading
            eyebrow="Live markets"
            title="Latest World Cup predictions"
            subtitle="Real-time odds from Polymarket. Track favorites, spot mispriced markets, and plan your tournament trades."
          />
          <div className="live-stack">
            <WorldCupPanel />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <SectionHeading eyebrow="How it works" title="Three steps to compete" />
          <div className="steps-grid">
            {howItWorks.map((step) => (
              <article key={step.step} className="step-card">
                <span className="step-card__number">{step.step}</span>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__body">{step.body}</p>
                {step.note && <p className="step-card__note">{step.note}</p>}
              </article>
            ))}
          </div>

          <div className="power-card">
            <div className="power-card__icon" aria-hidden="true">
              ⚡
            </div>
            <div>
              <h3 className="power-card__title">Use Power Plays</h3>
              <p className="power-card__body">
                You get 5 Power Plays. Activate one before a trade to double
                your P&L.
              </p>
              <p className="power-card__note">
                Power Plays add bonus P&L that only affects your ranking, not
                your available capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--prizes">
        <div className="container">
          <SectionHeading
            title="$250,000 guaranteed. Top 500 get rewards."
            subtitle="A World Cup prediction tournament built for people who can read the game."
          />

          <div className="podium">
            {podiumPrizes.map((prize) => (
              <div
                key={prize.place}
                className={`podium-card ${prize.featured ? "podium-card--featured" : ""}`}
              >
                <span className="podium-card__place">{prize.place}</span>
                <span className="podium-card__rank">{prize.rank}</span>
                <span className="podium-card__amount">{prize.amount}</span>
                <span className="podium-card__bonus">{prize.bonus}</span>
              </div>
            ))}
          </div>

          <div className="rewards-block">
            <h3 className="rewards-block__title">Top 500 traders earn rewards</h3>
            <p className="rewards-block__subtitle">Cash rewards and trading accounts</p>
            <div className="rewards-list">
              {rewardTiers.map((tier) => (
                <div key={tier.rank} className="rewards-row">
                  <span className="rewards-row__rank">{tier.rank}</span>
                  <span className="rewards-row__reward">
                    {tier.reward || tier.bonus}
                  </span>
                  {tier.reward ? (
                    <span className="rewards-row__bonus">{tier.bonus}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="section-cta">
            <JoinButton size="lg" />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <SectionHeading
            eyebrow="Rules and schedule"
            title="One global leaderboard, ranked by your P&L on virtual capital."
            subtitle="It runs alongside the knockout rounds, from the Round of 32 through to the Final."
          />

          <div className="phases-grid">
            {phases.map((phase) => (
              <article key={phase.label} className="phase-card">
                <div className="phase-card__header">
                  <span className="phase-card__label">{phase.label}</span>
                  <span className="phase-card__dates">{phase.dates}</span>
                </div>
                <h3 className="phase-card__title">{phase.title}</h3>
                <p className="phase-card__desc">{phase.description}</p>
                <dl className="phase-card__stats">
                  {phase.stats.map((stat) => (
                    <div key={stat.label} className="phase-stat">
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <div className="section-cta">
            <JoinButton size="lg" />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--tradeify">
        <div className="container">
          <SectionHeading
            title="Run by the prop firm that already paid out $250,000,000+"
            subtitle="Tradeify is the U.S. prop firm trusted by tens of thousands of futures traders for transparent rules, fast payouts, and trader-first design"
          />
          <div className="tradeify-grid">
            {tradeifyPoints.map((point) => (
              <article key={point.title} className="tradeify-card">
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container container--narrow">
          <SectionHeading eyebrow="FAQs" title="Questions? We've got answers." />
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question} className="faq-item">
                <summary className="faq-item__question">{faq.question}</summary>
                <p className="faq-item__answer">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-final">
        <div className="container landing-final__inner">
          <div className="landing-final__copy">
            <p className="landing-final__eyebrow">Don't just watch the World Cup. Trade it.</p>
            <h2 className="landing-final__title">
              Win up to <span className="text-accent">$100,000</span>.
            </h2>
            <p className="landing-final__desc">
              Enter free with $2,000 in virtual capital and compete on P&L
              against traders from around the world.
            </p>
          </div>
          <Countdown target={TOURNAMENT_START} />
          <JoinButton size="lg" />
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <p>© 2026 Tradeify. All rights reserved.</p>
          <p>World Cup prediction tournament. Free entry. Virtual capital only.</p>
        </div>
      </footer>
    </div>
  );
}
