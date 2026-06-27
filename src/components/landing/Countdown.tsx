import { useEffect, useState } from "react";

interface CountdownProps {
  target: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="countdown__unit">
      <span className="countdown__value">{String(value).padStart(2, "0")}</span>
      <span className="countdown__label">{label}</span>
    </div>
  );
}

export function Countdown({ target }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="countdown" aria-label="Tournament countdown">
      <CountdownUnit value={timeLeft.days} label="Days" />
      <CountdownUnit value={timeLeft.hours} label="Hours" />
      <CountdownUnit value={timeLeft.minutes} label="Minutes" />
      <CountdownUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
