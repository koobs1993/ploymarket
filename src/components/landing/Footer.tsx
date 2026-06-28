import { BrandLogo } from "./BrandLogo";
import { BRAND_NAME, socialLinks } from "../../data/landingContent";

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container landing-footer__inner">
        <div className="landing-footer__main">
          <a className="landing-footer__brand" href="#">
            <BrandLogo className="brand-logo--footer" />
          </a>

          <div className="landing-footer__socials">
            <p className="landing-footer__label">Socials</p>
            <ul className="landing-footer__social-list">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="landing-footer__social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      className="landing-footer__social-icon"
                      src={link.icon}
                      alt=""
                      loading="lazy"
                    />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
          <p>World Cup prediction tournament. Free entry. Simulated capital only.</p>
        </div>
      </div>
    </footer>
  );
}
