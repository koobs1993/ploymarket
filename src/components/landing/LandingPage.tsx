import { FeaturedIn } from "./FeaturedIn";
import { Footer } from "./Footer";
import { HowItWorks } from "./HowItWorks";
import { JoinButton } from "./JoinButton";
import { BrandLogo } from "./BrandLogo";
import { BrandSocialProof } from "./BrandSocialProof";
import { StickyJoinBar } from "./StickyJoinBar";
import { PrizeLeaderboard } from "./PrizeLeaderboard";
import { PrizePodium } from "./PrizePodium";
import { WorldCupHero } from "../WorldCupHero";
import { WorldCupPredictions } from "../WorldCupPredictions";
import { Ticker } from "../Ticker";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  EVENT_NAME,
  faqs,
  heroBenefits,
  navLinks,
  predictionsSection,
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
  const { user } = useAuth();

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="container landing-nav__inner">
          <a className="landing-nav__brand" href="#">
            <BrandLogo className="brand-logo--nav" />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <nav className="landing-nav__links" aria-label="Page sections">
              {navLinks.map((link) => (
                <a key={link.href} className="landing-nav__link" href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
            <Link 
              to={user ? "/trade" : "/auth"} 
              className="landing-nav__link" 
              style={{ 
                border: "1px solid #1f2937", 
                padding: "6px 16px", 
                borderRadius: "6px",
                backgroundColor: "#121824",
                textDecoration: "none",
                fontWeight: "600"
              }}
            >
              {user ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero" id="join">
        <div className="landing-hero__glow" aria-hidden="true" />
        <div className="container landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">{EVENT_NAME}</p>
            <h1 className="landing-hero__title">
              Predict the World Cup.
              <br />
              <span className="text-accent">Win cash &amp; funding.</span>
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

      <Ticker />

      <FeaturedIn />

      <section className="landing-section landing-section--steps" id="how-it-works">
        <div className="container">
          <SectionHeading
            eyebrow="How It Works"
            title="Participating Is This Easy"
            subtitle="Trade with simulated capital and compete for real cash and funding."
            align="center"
          />
          <HowItWorks />
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
            eyebrow={predictionsSection.eyebrow}
            title={predictionsSection.title}
            subtitle={predictionsSection.subtitle}
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

      <Footer />

      <StickyJoinBar />
    </div>
  );
}
