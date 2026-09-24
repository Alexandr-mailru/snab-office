type BrandLogoProps = {
  variant?: "header" | "hero" | "footer";
  className?: string;
};

const sizes = {
  header: { width: 220, height: 40, className: "logo-header" },
  hero: { width: 520, height: 95, className: "logo-hero" },
  footer: { width: 200, height: 37, className: "logo-footer" },
};

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const size = sizes[variant];
  const cls = `${size.className} ${className}`.trim();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.svg"
      alt="Торговый дом СнабОфис"
      width={size.width}
      height={size.height}
      className={cls}
      decoding="async"
    />
  );
}
