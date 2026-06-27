interface JoinButtonProps {
  className?: string;
  size?: "md" | "lg";
}

export function JoinButton({ className = "", size = "md" }: JoinButtonProps) {
  return (
    <a
      href="#join"
      className={`join-btn join-btn--${size} ${className}`.trim()}
    >
      <span className="join-btn__icon" aria-hidden="true">
        ⚡
      </span>
      Join for FREE
    </a>
  );
}
