import { useAuth } from "../context/AuthContext";
import { TradeHeader } from "../components/TradeHeader";
import { getInitials } from "../utils/profile";
import { formatDate } from "../utils/format";

export function ProfilePage() {
  const { user, profile, tradingAccount } = useAuth();
  const displayName = profile?.display_name || "Trader";
  const initials = getInitials(displayName);

  return (
    <div className="trade-app" style={{ backgroundColor: "#040812", minHeight: "100vh" }}>
      <TradeHeader />

      <div className="trade-container">
        <h2 className="markets-section-title">Your Profile</h2>
        <p className="markets-section-desc">
          Basic account details for your GoatFunded trading profile.
        </p>

        <div className="profile-card">
          <div className="profile-card__header">
            <div className="trade-profile-avatar trade-profile-avatar--large">
              {initials}
            </div>
            <div>
              <h3 className="profile-card__name">{displayName}</h3>
              <p className="profile-card__email">{user?.email || "—"}</p>
              {tradingAccount && (
                <span
                  className={`trade-account-status trade-account-status--${tradingAccount.status}`}
                >
                  {tradingAccount.status}
                </span>
              )}
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <span className="profile-detail__label">Display Name</span>
              <span className="profile-detail__value">{displayName}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-detail__label">Email</span>
              <span className="profile-detail__value">{user?.email || "—"}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-detail__label">Member Since</span>
              <span className="profile-detail__value">
                {profile?.created_at ? formatDate(profile.created_at) : "—"}
              </span>
            </div>
            <div className="profile-detail">
              <span className="profile-detail__label">Role</span>
              <span className="profile-detail__value">
                {profile?.is_admin ? "Administrator" : "Trader"}
              </span>
            </div>
            <div className="profile-detail">
              <span className="profile-detail__label">User ID</span>
              <span className="profile-detail__value profile-detail__value--mono">
                {user?.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
