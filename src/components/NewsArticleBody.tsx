import { toTelHref } from "@/lib/phone";

type AddressBlock = {
  place: string;
  hours?: string;
  phone?: string;
  tel?: string;
};

type ArticleBlock =
  | { type: "lead"; text: string }
  | { type: "body"; text: string }
  | { type: "kicker"; text: string }
  | { type: "point"; title: string; text: string }
  | { type: "list"; intro: string | null; items: string[] }
  | { type: "stores"; places: AddressBlock[] }
  | { type: "close"; text: string };

function storeTelHref(phone: string) {
  const href = toTelHref(phone);
  if (href) return href;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 6) return `tel:+74242${digits}`;
  return undefined;
}

function parseAddress(text: string): AddressBlock | null {
  if (!/^\s*(ул\.|пр-т|проспект|коммунистический)/i.test(text)) return null;
  const [placeRaw, restRaw] = text.split(/\s[—–-]\s/, 2);
  const place = (placeRaw ?? text).replace(/\.$/, "").trim();
  const rest = (restRaw ?? "").trim();
  const phoneMatch = rest.match(/телефон:\s*([\d()\-\s]+)/i);
  const phone = phoneMatch?.[1]?.trim();
  const hours = rest.replace(/,?\s*телефон:.*$/i, "").replace(/\.$/, "").trim();
  return {
    place,
    hours: hours || undefined,
    phone,
    tel: phone ? storeTelHref(phone) : undefined,
  };
}

function parsePoint(text: string) {
  const match = text.match(/^(.{2,55}?)\s[—–]\s(.+)$/s);
  if (!match) return null;
  const title = match[1].trim();
  const rest = match[2].trim();
  if (/[.,!?;:]/.test(title) || title.split(/\s+/).length > 8) return null;
  return { title, text: rest };
}

function isKicker(text: string) {
  if (text.length > 110) return false;
  return /^(линейка представлена|в серии представлены|ждем вас|в ассортименте представлены[^;]*:?$)/i.test(
    text.trim(),
  );
}

function isClose(text: string) {
  return /вместе с тд|каждый сможет выбрать|практичное решение для организации|подготовьте всё необходимое/i.test(
    text,
  );
}

function parseList(text: string) {
  if (!text.includes(";")) return null;
  const colon = text.indexOf(":");
  const intro =
    colon > 0 && colon < 80 ? text.slice(0, colon).replace(/:$/, "").trim() : null;
  const source = intro ? text.slice(colon + 1) : text;
  const items = source
    .split(";")
    .map((part) => part.replace(/^[^:]+:\s*/i, "").trim().replace(/[.]$/, ""))
    .filter(Boolean);
  if (items.length < 2) return null;
  return { intro, items };
}

function toBlocks(paragraphs: string[]): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let stores: AddressBlock[] = [];

  const flushStores = () => {
    if (!stores.length) return;
    blocks.push({ type: "stores", places: stores });
    stores = [];
  };

  paragraphs.forEach((raw, index) => {
    const text = raw.trim();
    if (!text) return;

    const address = parseAddress(text);
    if (address) {
      stores.push(address);
      return;
    }
    flushStores();

    if (index === 0) {
      blocks.push({ type: "lead", text });
      return;
    }

    const list = parseList(text);
    if (list) {
      blocks.push({ type: "list", ...list });
      return;
    }

    if (isKicker(text)) {
      blocks.push({ type: "kicker", text: text.replace(/:$/, "") });
      return;
    }

    const point = parsePoint(text);
    if (point) {
      blocks.push({ type: "point", ...point });
      return;
    }

    if (isClose(text)) {
      blocks.push({ type: "close", text });
      return;
    }

    blocks.push({ type: "body", text });
  });

  flushStores();
  return blocks;
}

export function NewsArticleBody({ paragraphs }: { paragraphs: string[] }) {
  const blocks = toBlocks(paragraphs);
  if (!blocks.length) return null;

  return (
    <article className="news-article-content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "lead") {
          return (
            <p key={key} className="news-article-lead-block">
              {block.text}
            </p>
          );
        }

        if (block.type === "kicker") {
          return (
            <h2 key={key} className="news-article-subhead">
              {block.text}
            </h2>
          );
        }

        if (block.type === "point") {
          return (
            <section key={key} className="news-article-point">
              <h3>{block.title}</h3>
              <p>{block.text}</p>
            </section>
          );
        }

        if (block.type === "list") {
          return (
            <section key={key} className="news-article-block">
              {block.intro ? (
                <h2 className="news-article-subhead">{block.intro}</h2>
              ) : null}
              <ul className="news-article-list">
                {block.items.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            </section>
          );
        }

        if (block.type === "stores") {
          return (
            <section key={key} className="news-article-stores" aria-label="Адреса магазинов">
              {block.places.map((place) => (
                <address key={place.place} className="news-article-address">
                  <p className="news-article-address-place">{place.place}</p>
                  {place.hours ? (
                    <p className="news-article-address-hours">{place.hours}</p>
                  ) : null}
                  {place.phone ? (
                    <p className="news-article-address-phone">
                      {place.tel ? (
                        <a href={place.tel}>{place.phone}</a>
                      ) : (
                        place.phone
                      )}
                    </p>
                  ) : null}
                </address>
              ))}
            </section>
          );
        }

        if (block.type === "close") {
          return (
            <p key={key} className="news-article-close">
              {block.text}
            </p>
          );
        }

        return (
          <p key={key} className="news-article-body">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
