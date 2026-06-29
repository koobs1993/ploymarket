import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface JoinButtonProps {
  className?: string;
  size?: "md" | "lg";
  label?: string;
}

export function JoinButton({
  className = "",
  size = "md",
  label = "Join for FREE",
}: JoinButtonProps) {
  const { user } = useAuth();
  const to = user ? "/trade" : "/auth";

  return (
    <Link
      to={to}
      className={`join-btn join-btn--${size} ${className}`.trim()}
    >
      <span className="join-btn__label">{user ? "Go to Dashboard" : label}</span>
      <span className="join-btn__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
