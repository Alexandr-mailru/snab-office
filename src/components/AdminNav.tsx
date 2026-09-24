import Link from "next/link";

const links = [
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/inbox", label: "Заявки" },
];

export function AdminNav({ active }: { active?: string }) {
  return (
    <nav className="admin-nav cta-row" aria-label="Админка">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`btn ${active === link.href ? "btn-primary" : "btn-ghost"}`}
        >
          {link.label}
        </Link>
      ))}
      <Link href="/account/cabinet" className="btn btn-secondary">
        В кабинет
      </Link>
    </nav>
  );
}
