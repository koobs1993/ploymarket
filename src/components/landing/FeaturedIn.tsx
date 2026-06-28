import { mediaLogos } from "../../data/landingContent";

export function FeaturedIn() {
  return (
    <section className="featured-in" aria-label="GoatFunded featured in">
      <div className="container featured-in__inner">
        <p className="featured-in__title">GoatFunded featured in</p>
        <div className="featured-in__logos">
          {mediaLogos.map((logo) => (
            <div key={logo.name} className="featured-in__logo">
              <img src={logo.src} alt={logo.name} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
