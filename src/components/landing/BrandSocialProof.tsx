import { BRAND_NAME, brandStats, mediaLogos } from "../../data/landingContent";

export function BrandSocialProof() {
  return (
    <div className="brand-proof">
      <div className="brand-proof__logos">
        {mediaLogos.map((logo) => (
          <div key={logo.name} className="brand-proof__logo">
            <img src={logo.src} alt={logo.name} loading="lazy" />
          </div>
        ))}
      </div>

      <div className="brand-proof__intro">
        <span className="section-heading__eyebrow">Run by {BRAND_NAME}</span>
        <h2 className="brand-proof__title">
          The prop firm built for transparent payouts.
        </h2>
      </div>

      <div className="brand-proof__grid">
        {brandStats.map((stat) => (
          <article
            key={stat.title}
            className={`brand-stat${stat.featured ? " brand-stat--featured" : ""}`}
          >
            <div className="brand-stat__copy">
              <h3 className="brand-stat__title">{stat.title}</h3>
              <p className="brand-stat__desc">{stat.desc}</p>
            </div>
            {stat.image && (
              <div className="brand-stat__art">
                <img src={stat.image} alt="" loading="lazy" />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
