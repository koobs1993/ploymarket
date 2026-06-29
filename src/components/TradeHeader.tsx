import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "./landing/BrandLogo";
import { getInitials, formatMoney } from "../utils/profile";

export function TradeHeader() {
  const { profile, tradingAccount, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.display_name || "Trader";
  const initials = getInitials(displayName);

  const isActive = (path: string) => {
    if (path === "/trade") {
      return (
        location.pathname === "/trade" ||
        location.pathname.startsWith("/trade/")
      );
    }
    return location.pathname === path;
  };

  const activeClass = (path: string) =>
    isActive(path) ? "trade-nav-link trade-nav-link--active" : "trade-nav-link";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/auth");
  }

  return (
    <header className="trade-header">
      <div className="trade-header__inner">
        <div className="trade-nav">
          <Link to="/" className="trade-nav__brand" style={{ textDecoration: "none" }}>
            <BrandLogo className="brand-logo--nav" />
          </Link>
          <Link to="/trade" className={activeClass("/trade")}>
            Trade
          </Link>
          <Link to="/portfolio" className={activeClass("/portfolio")}>
            Portfolio
          </Link>
          <Link to="/account" className={activeClass("/account")}>
            Account
          </Link>
          {profile?.is_admin && (
            <Link to="/admin" className={activeClass("/admin")}>
              Admin
            </Link>
          )}
        </div>

        <div className="trade-user-menu">
          {tradingAccount && (
            <div className="trade-nav-balance">
              <span className="trade-nav-balance__label">Cash</span>
              <span className="trade-nav-balance__value">
                ${formatMoney(tradingAccount.cash_balance)}
              </span>
            </div>
          )}

          <div className="trade-profile-dropdown" ref={menuRef}>
            <button
              type="button"
              className="trade-profile-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="trade-profile-avatar">{initials}</span>
            </button>

            {menuOpen && (
              <div className="trade-profile-menu" role="menu">
                <div className="trade-profile-menu__header">
                  <span className="trade-profile-avatar trade-profile-avatar--small">
                    {initials}
                  </span>
                  <div>
                    <div className="trade-profile-menu__name">{displayName}</div>
                    {tradingAccount && (
                      <span
                        className={`trade-account-status trade-account-status--${tradingAccount.status}`}
                      >
                        {tradingAccount.status}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="trade-profile-menu__item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  See Profile
                </Link>
                <button
                  type="button"
                  className="trade-profile-menu__item trade-profile-menu__item--danger"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
