import Link from "next/link";

type Variant = {
  slug: string;
  variantLabel: string | null;
  stock: number;
  imageUrl: string | null;
};

export function VariantSwitcher({
  currentSlug,
  variants,
}: {
  currentSlug: string;
  variants: Variant[];
}) {
  if (variants.length < 2) return null;

  return (
    <div className="variant-switcher">
      <p className="variant-label">Вариант</p>
      <div className="variant-list">
        {variants.map((v) => {
          const active = v.slug === currentSlug;
          return (
            <Link
              key={v.slug}
              href={`/product/${v.slug}`}
              className={`variant-chip ${active ? "is-active" : ""} ${v.stock <= 0 ? "is-out" : ""}`}
              title={v.variantLabel || v.slug}
            >
              {v.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.imageUrl} alt="" />
              ) : null}
              <span>{v.variantLabel || "Вариант"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
