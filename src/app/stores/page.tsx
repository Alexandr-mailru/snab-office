import { StoreCard } from "@/components/StoreCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Магазины" };

/** Одна карта с двумя точками — как на snaboffice.demo */
const SHARED_MAP =
  "https://yandex.ru/map-widget/v1/?ll=142.7337%2C46.9464&z=13&pt=142.73111739021,46.958095654238,pm2rdm~142.73627594373,46.934683503974,pm2blm";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Розничная сеть</p>
        <h1 className="page-title">Магазины СнабОфис</h1>
        <p className="lead">Два адреса в Москве. В каждом магазине есть менеджер для организаций.</p>
      </div>

      <div className="map-embed map-embed-wide">
        <iframe
          title="Карта магазинов СнабОфис"
          src={SHARED_MAP}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="store-grid store-grid-equal">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>
    </div>
  );
}
