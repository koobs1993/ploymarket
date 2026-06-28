import { JoinButton } from "./JoinButton";
import { BrandLogo } from "./BrandLogo";
import { BrandSocialProof } from "./BrandSocialProof";
import { StickyJoinBar } from "./StickyJoinBar";
import { PrizeLeaderboard } from "./PrizeLeaderboard";
import { PrizePodium } from "./PrizePodium";
import { WorldCupHero } from "../WorldCupHero";
import { WorldCupPredictions } from "../WorldCupPredictions";
import {
  BRAND_NAME,
  EVENT_NAME,
  faqs,
  heroBenefits,
  howItWorks,
  prizeHeadline,
} from "../../data/landingContent";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      {eyebrow && <span className="section-heading__eyebrow">{eyebrow}</span>}
      <h2 className="section-heading__title">{title}</h2>
      {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav landing-nav--simple">
        <div className="container landing-nav__inner">
          <a className="landing-nav__brand" href="#">
            <BrandLogo className="brand-logo--nav" />
          </a>
        </div>
      </header>

      <section className="landing-hero" id="join">
        <div className="landing-hero__glow" aria-hidden="true" />
        <div className="container landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">{EVENT_NAME}</p>
            <h1 className="landing-hero__title">
              Predict the World Cup.
              <span className="text-accent"> Win cash &amp; funding.</span>
            </h1>
            <p className="landing-hero__desc">
              Trade with $100,000 in simulated capital
            </p>

            <div className="landing-hero__actions">
              <JoinButton size="lg" />
              <ul className="hero-benefits">
                {heroBenefits.map((item) => (
                  <li key={item} className="hero-benefits__item">
                    <span className="hero-benefits__check" aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="landing-hero__visual">
            <WorldCupHero compact />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--steps" id="how-it-works">
        <div className="container">
          <SectionHeading
            eyebrow="How It Works"
            title="Participating Is This Easy"
            align="center"
          />
          <div className="steps-panel">
            <div className="steps-grid steps-grid--simple">
              {howItWorks.map((step) => (
                <article key={step.step} className="step-card step-card--simple">
                  <span className="step-card__number">{step.step}</span>
                  <h3 className="step-card__title">{step.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--prizes" id="prizes">
        <div className="container">
          <div className="prize-banner">
            <span className="prize-banner__cash">{prizeHeadline.cash}</span>
            <span className="prize-banner__dot" aria-hidden="true">
              •
            </span>
            <span className="prize-banner__funding">{prizeHeadline.funding}</span>
            <span className="prize-banner__tagline">{prizeHeadline.tagline}</span>
          </div>

          <SectionHeading
            align="center"
            eyebrow="Prizes"
            title="$10K cash. $1M in funding."
            subtitle="Top 50 traders win cash and funded accounts."
          />

          <PrizePodium />
          <PrizeLeaderboard />

          <div className="section-cta">
            <JoinButton size="lg" />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--live" id="markets">
        <div className="container">
          <SectionHeading
            eyebrow="Live markets"
            title="Trade These World Cup Predictions"
            subtitle="Real-time Polymarket odds. Pick your markets and compete on the leaderboard."
          />
          <div className="live-stack">
            <WorldCupPredictions />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--brand" id="about">
        <div className="container">
          <BrandSocialProof />
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="container container--narrow">
          <SectionHeading
            align="center"
            eyebrow="Questions"
            title="FAQs"
          />
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

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <div className="landing-footer__brand">
            <BrandLogo className="brand-logo--footer" />
          </div>
          <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
          <p>World Cup prediction tournament. Free entry. Simulated capital only.</p>
        </div>
      </footer>

      <StickyJoinBar />
    </div>
  );
}
