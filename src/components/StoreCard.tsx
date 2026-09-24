import { PhoneText } from "@/components/PhoneText";
import {
  storeDescriptionLines,
  unbreakableAddress,
  unbreakableHours,
} from "@/lib/storeText";

export type StoreCardData = {
  id: string;
  name: string;
  address: string;
  description: string;
  phones: string;
  hours: string;
  corporatePhones?: string | null;
  corporateHours?: string | null;
};

export function StoreCard({
  store,
  variant = "page",
}: {
  store: StoreCardData;
  variant?: "page" | "home";
}) {
  const lines = storeDescriptionLines(store.description);
  const className = variant === "home" ? "info-card store-card store-card--home" : "store-card";

  return (
    <article className={className}>
      <h3 className="store-card-title">
        {store.name.replace(/«СнабОфис»/g, "«ТД\u00A0СнабОфис»")}
      </h3>
      <p className="store-card-address muted">{unbreakableAddress(store.address)}</p>
      <div className="store-card-desc">
        {lines.map((line) => (
          <p key={line.slice(0, 48)}>{line}</p>
        ))}
      </div>
      <div className="store-card-meta">
        <p className="store-card-phone">
          <PhoneText text={store.phones} />
        </p>
        <p className="store-card-hours">{unbreakableHours(store.hours)}</p>
      </div>
      {store.corporatePhones ? (
        <p className="store-card-corp">
          <strong>Менеджер для организаций:</strong>{" "}
          <PhoneText text={store.corporatePhones} />
          {store.corporateHours ? (
            <>
              <br />
              <span className="muted">{unbreakableHours(store.corporateHours)}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
