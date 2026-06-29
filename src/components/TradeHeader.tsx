import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export function TradeHeader() {
  const { profile, tradingAccount, signOut } = useAuth();
  const location = useLocation();

  const activeClass = (path: string) =>
    location.pathname === path ? "trade-nav-link trade-nav-link--active" : "trade-nav-link";

  return (
    <header className="trade-header">
      <div className="trade-header__inner">
        <div className="trade-nav">
          <Link to="/" className="auth-logo" style={{ textDecoration: "none", marginBottom: 0 }}>
            <span className="logo-goat">Goat</span>
            <span className="logo-funded">Funded</span>
          </Link>
          <Link to="/trade" className={activeClass("/trade")}>
            Trade
          </Link>
          <Link to="/portfolio" className={activeClass("/portfolio")}>
            Portfolio
          </Link>
          {profile?.is_admin && (
            <Link to="/admin" className={activeClass("/admin")}>
              Admin
            </Link>
          )}
        </div>

        <div className="trade-user-menu">
          <div className="trade-user-info">
            <div className="trade-user-name">{profile?.display_name || "Trader"}</div>
            {tradingAccount && (
              <span className={`trade-account-status trade-account-status--${tradingAccount.status}`}>
                {tradingAccount.status}
              </span>
            )}
          </div>
          <button onClick={signOut} className="trade-signout-btn">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
