import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const DEFAULT_ADMIN_EMAIL = "admin@goatfunded.com";

function normalizeLoginEmail(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@goatfunded.com`;
}

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // After email confirmation, Supabase redirects here with tokens in the URL hash
  useEffect(() => {
    if (!window.location.hash.includes("access_token")) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.history.replaceState(null, "", "/auth");
        navigate("/trade", { replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const redirectTo =
      import.meta.env.VITE_SITE_URL
        ? `${import.meta.env.VITE_SITE_URL}/auth`
        : `${window.location.origin}/auth`;

    try {
      if (isSignUp) {
        // Sign Up with metadata
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              display_name: displayName || email.split("@")[0],
              is_admin: isAdmin,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setSuccess("Account created successfully!");
          setTimeout(() => navigate("/trade"), 1000);
        } else {
          setSuccess("Sign up successful! Please check your email for confirmation (if enabled) or try logging in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeLoginEmail(email),
          password,
        });

        if (error) throw error;

        setSuccess("Signed in successfully!");
        setTimeout(() => navigate("/trade"), 1000);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-goat">Goat</span>
          <span className="logo-funded">Funded</span>
          <span className="logo-badge">World Cup</span>
        </div>

        <h2 className="auth-title">{isSignUp ? "Create Your Trading Account" : "Sign In to Your Challenge"}</h2>
        <p className="auth-subtitle">
          {isSignUp
            ? "Get $100,000 in simulated capital and compete for funding"
            : `Monitor your equity, manage trades, and check rules. Default admin: admin / password123 (${DEFAULT_ADMIN_EMAIL})`}
        </p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {success && <div className="auth-alert auth-alert--success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="auth-group">
              <label className="auth-label">Display Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Trader Goat"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className="auth-group">
            <label className="auth-label">
              {isSignUp ? "Email Address" : "Email or Username"}
            </label>
            <input
              type="text"
              className="auth-input"
              placeholder={isSignUp ? "trader@goatfunded.com" : "admin or trader@goatfunded.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="auth-checkbox-group">
              <input
                type="checkbox"
                id="is-admin-checkbox"
                className="auth-checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <label htmlFor="is-admin-checkbox" className="auth-checkbox-label">
                Create account with Administrator permissions (for testing)
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Please wait..." : isSignUp ? "Start Challenge" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up Free"}
          </button>
        </div>
      </div>
    </div>
  );
}
