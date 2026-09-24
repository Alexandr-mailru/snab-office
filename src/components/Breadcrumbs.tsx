import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
