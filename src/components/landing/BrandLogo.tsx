import logo from "../../img/gft-logo.webp";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt="GoatFunded"
      className={`brand-logo ${className}`.trim()}
    />
  );
}
