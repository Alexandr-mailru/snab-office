import Link from "next/link";
import { PhoneLink } from "@/components/PhoneText";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Для организаций",
  description:
    "Заказ канцелярии и товаров для офиса компаниям и учреждениям в Москве: договор, список цен, менеджер.",
};

export default async function CorporatePage() {
  const documents = await prisma.document.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">Компании и учреждения</p>
        <h1 className="page-title">Для организаций</h1>
        <p className="lead">
          Нужна канцелярия или товары для офиса на компанию, школу или учреждение? Оформите заказ на
          сайте или позвоните менеджеру — подготовим документы и согласуем получение. Оптовой продажи
          нет: работаем в розницу, в том числе по договору для организаций.
        </p>
      </div>

      <div className="split-band" style={{ width: "100%", paddingBottom: "1rem" }}>
        <article className="info-card">
          <h3>Файлы для скачивания</h3>
          <ul className="doc-list">
            {documents.map((doc) => {
              const brokenZip =
                doc.fileUrl.endsWith("/pr_snaboffice.zip") || doc.fileName === "pr_snaboffice.zip";
              const href = brokenZip ? "/docs/snaboffice-price-list.txt" : doc.fileUrl;
              const fileName = brokenZip ? "snaboffice-price-list.txt" : doc.fileName;
              return (
                <li key={doc.id}>
                  <a href={href} download={fileName}>
                    {doc.title}
                  </a>
                  <span className="muted"> — {doc.description}</span>
                </li>
              );
            })}
          </ul>
          <Link href="/checkout?forOrg=1" className="btn btn-primary">
            Оформить заказ для компании
          </Link>
        </article>
        <article className="info-card">
          <h3>Телефоны менеджеров</h3>
          <p>
            <strong>Магазин на Коммунистическом:</strong> <PhoneLink phone="(4242) 22-19-22" />
          </p>
          <p className="muted">Пн–Чт 09:00–18:00, Пт 09:00–17:00</p>
          <p>
            <strong>Магазин на Пуркаева:</strong> <PhoneLink phone="(4242) 23-76-73" />
          </p>
          <p className="muted">Пн–Чт 09:00–18:00, Пт 09:00–17:00</p>
          <p>
            Telegram <PhoneLink phone="+7 914 755-34-67" />
          </p>
        </article>
      </div>
    </div>
  );
}
