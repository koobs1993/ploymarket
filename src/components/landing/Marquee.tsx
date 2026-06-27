interface MarqueeProps {
  items: string[];
  className?: string;
}

export function Marquee({ items, className = "" }: MarqueeProps) {
  const loop = [...items, ...items];

  return (
    <div className={`marquee ${className}`.trim()} aria-hidden="true">
      <div className="marquee__track">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="marquee__item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
