import { useEffect, useState } from "react";
import { JoinButton } from "./JoinButton";

export function StickyJoinBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("join");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`sticky-join${visible ? " sticky-join--visible" : ""}`}
      aria-hidden={!visible}
    >
      <JoinButton size="lg" className="sticky-join__btn" />
    </div>
  );
}
