import { howItWorks } from "../../data/landingContent";

export function HowItWorks() {
  return (
    <div className="hiw-grid">
      {howItWorks.map((step) => (
        <article
          key={step.name}
          className={`hiw-card${step.showArrow ? "" : " hiw-card--last"}`}
        >
          <div className="hiw-card__illustration">
            <img src={step.illustration} loading="lazy" alt={step.illustrationAlt} />
          </div>
          <div className="hiw-card__content">
            <h3 className="hiw-card__name">{step.name}</h3>
            <p className="hiw-card__desc">{step.description}</p>
          </div>
          {step.showArrow && (
            <div className="hiw-card__arrow" aria-hidden="true">
              <span className="hiw-card__arrow-icon" />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
