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
  return (
    <a
      href="#join"
      className={`join-btn join-btn--${size} ${className}`.trim()}
    >
      <span className="join-btn__label">{label}</span>
      <span className="join-btn__arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
