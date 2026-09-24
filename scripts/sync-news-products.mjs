import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import path from "path";

const base = "https://xn--80aqgg1a.xn--p1ai";
const prodDir = path.join(process.cwd(), "public", "products");
const dataPath = path.join(process.cwd(), "prisma", "data", "products.json");
mkdirSync(prodDir, { recursive: true });

function decodeHtml(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function preferFull(url) {
  return url.replace(/\.resize2\./i, ".resize1.");
}

async function download(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(filePath, buf);
  return buf.length;
}

async function parseDetail(id) {
  const res = await fetch(`${base}/catalog/detail/?ELEMENT_ID=${id}`);
  const html = await res.text();
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = nameMatch ? decodeHtml(nameMatch[1].replace(/<[^>]+>/g, "")) : null;
  if (!name || /ошибка|не найден/i.test(name)) {
    return { id, fail: true };
  }

  const fromFancy = [...html.matchAll(/data-fancybox="images"[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const fromSrc = [...html.matchAll(/src="(\/upload\/iblock\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map((m) => m[1]);
  const all = [...fromFancy, ...fromSrc]
    .map((u) => (u.startsWith("http") ? new URL(u).pathname : u))
    .map(preferFull)
    .filter((u) => /\/upload\/iblock\//i.test(u) && !/nopic/i.test(u));

  const unique = [];
  const seen = new Set();
  for (const u of all) {
    const key = u.replace(/\.resize1\./i, ".").replace(/\.resize2\./i, ".");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(u);
    if (unique.length >= 6) break;
  }

  const priceMatch = html.match(/Цена:<\/span>\s*([\d\s]+)/);
  const price = priceMatch ? Number(priceMatch[1].replace(/\s/g, "")) : 0;
  const skuMatch = html.match(/Артикул:<\/span>\s*([^<\s]+)/);
  const sku = skuMatch ? skuMatch[1].trim() : `AMX-${id}`;
  const codeMatch = html.match(/Код:<\/span>\s*([^<\s]+)/);
  const code = codeMatch ? codeMatch[1].trim() : null;

  let desc = "";
  const descMatch = html.match(/В наличии[\s\S]{0,220}<p>\s*(?:<br\s*\/?>\s*)*([\s\S]{40,900}?)<\/p>/i);
  if (descMatch) desc = decodeHtml(descMatch[1].replace(/<[^>]+>/g, " "));
  if (desc.length < 30) {
    const paras = [...html.matchAll(/<p>\s*(?:<br\s*\/?>\s*)*([^<]{50,500})/gi)]
      .map((m) => decodeHtml(m[1]))
      .filter((t) => !/cookie|каталог|политика/i.test(t));
    desc = paras[0] || name || "";
  }

  return { id, name, imgs: unique, price, sku, code, desc, fail: false };
}

/** Plan: ELEMENT_ID (Bitrix), not catalog "Код" */
const plan = [
  // MAPED Color'Peps (~10)
  { id: 462348, slug: "karandashi-maped-infinity-12", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: true, onSale: false },
  { id: 462349, slug: "karandashi-maped-infinity-24", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: true, onSale: false },
  { id: 550337, slug: "karandashi-maped-infinity-kidy-jumbo-12", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: true, onSale: false },
  { id: 550471, slug: "karandashi-maped-infinity-kidy-jumbo-metal", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: true, onSale: true },
  { id: 526809, slug: "nabor-maped-infinity-jungle-27", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: true, onSale: false },
  { id: 265105, slug: "karandashi-maped-animals-12", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: false, isNew: true, onSale: false },
  { id: 52282, slug: "karandashi-maped-duo-24", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: false, isNew: false, onSale: false },
  { id: 52283, slug: "karandashi-maped-star-24", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: false, isNew: false, onSale: false },
  { id: 67329, slug: "karandashi-maped-jumbo-12", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: false, isNew: false, onSale: false },
  { id: 78549, slug: "karandashi-maped-aqua-12", brand: "Maped", brandSlug: "maped", cat: "karandashi", theme: "maped", featured: true, isNew: false, onSale: false },

  // URBANROOT missing variants
  { id: 547965, slug: "podstavka-deli-urbanroot-rozovaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", theme: "urbanroot", featured: true, isNew: true, onSale: false, variantGroup: "deli-urbanroot-4", variantLabel: "Розовая" },
  { id: 547976, slug: "podstavka-deli-urbanroot-yashiki-zelenaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", theme: "urbanroot", featured: true, isNew: true, onSale: false, variantGroup: "deli-urbanroot-drawers", variantLabel: "Зелёная" },
  { id: 547977, slug: "podstavka-deli-urbanroot-yashiki-rozovaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", theme: "urbanroot", featured: true, isNew: true, onSale: true, variantGroup: "deli-urbanroot-drawers", variantLabel: "Розовая" },

  // CRETACOLOR powders
  { id: 529625, slug: "pudra-cretacolor-sangina", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", theme: "cretacolor", featured: true, isNew: true, onSale: false, variantGroup: "cretacolor-powder", variantLabel: "Сангина" },
  { id: 529626, slug: "pudra-cretacolor-sepiya", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", theme: "cretacolor", featured: true, isNew: true, onSale: false, variantGroup: "cretacolor-powder", variantLabel: "Сепия" },
  { id: 312245, slug: "karandash-cretacolor-ugolnyj-myagkij", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", theme: "cretacolor", featured: false, isNew: false, onSale: false },
  { id: 312246, slug: "karandash-cretacolor-ugolnyj-srednij", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", theme: "cretacolor", featured: false, isNew: false, onSale: false },

  // SCHOOL BAZAAR creative mix
  { id: 498539, slug: "tetrad-polinom-48-van-gog", brand: "Полином", brandSlug: "polinom", cat: "shkola", theme: "school", featured: true, isNew: true, onSale: false },
  { id: 550213, slug: "ryukzak-devente-lifestyle-ghost", brand: "deVENTE", brandSlug: "devente", cat: "shkola", theme: "school", featured: true, isNew: true, onSale: false },
  { id: 503398, slug: "penal-fenix-treugolnyj", brand: "Fenix", brandSlug: "fenix", cat: "shkola", theme: "school", featured: false, isNew: true, onSale: false },
  { id: 531959, slug: "ruchka-stihiya-vechnyj-karandash", brand: "Стихия", brandSlug: "stihiya", cat: "ruchki", theme: "school", featured: false, isNew: true, onSale: false },
  { id: 549392, slug: "bumaga-cvetnaya-artspace-8", brand: "ArtSpace", brandSlug: "artspace", cat: "bumaga", theme: "school", featured: false, isNew: false, onSale: false },
  { id: 532725, slug: "guash-stihiya-12", brand: "Стихия", brandSlug: "stihiya", cat: "hudozhestvennye", theme: "school", featured: true, isNew: true, onSale: false },
  { id: 460892, slug: "nozhnicy-bruno-ergocut", brand: "BrunoVisconti®", brandSlug: "bruno-visconti", cat: "shkola", theme: "school", featured: false, isNew: false, onSale: false },
  { id: 372005, slug: "klej-kores-glue-eco-10", brand: "Kores", brandSlug: "kores", cat: "kancelyariya", theme: "school", featured: false, isNew: false, onSale: false },
  { id: 401022, slug: "dnevnik-unnika-shkolnicy", brand: "Unnika land®", brandSlug: "unnika-land", cat: "shkola", theme: "school", featured: false, isNew: false, onSale: false },
  { id: 550513, slug: "penal-maped-kidy-learn", brand: "Maped", brandSlug: "maped", cat: "shkola", theme: "school", featured: false, isNew: true, onSale: false },
];

function nextPrefix(existing) {
  let max = 16;
  for (const p of existing) {
    const m = String(p.imageUrl || "").match(/\/p(\d+)/i);
    if (m) max = Math.max(max, Number(m[1]));
    for (const img of p.images || []) {
      const m2 = String(img).match(/\/p(\d+)/i);
      if (m2) max = Math.max(max, Number(m2[1]));
    }
  }
  return max + 1;
}

async function main() {
  const existing = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, "utf8")) : [];
  const bySlug = new Set(existing.map((p) => p.slug));
  const byExternal = new Set(existing.map((p) => p.externalId).filter(Boolean));
  const bySource = new Set(existing.map((p) => p.sourceId).filter(Boolean));

  let prefixNum = nextPrefix(existing);
  const added = [];
  const failed = [];
  const byTheme = {};

  for (const item of plan) {
    if (bySlug.has(item.slug) || byExternal.has(`1c-${item.id}`) || bySource.has(item.id)) {
      console.log("SKIP existing", item.slug, item.id);
      continue;
    }

    const d = await parseDetail(item.id);
    if (d.fail || !d.name) {
      console.log("FAIL detail", item.id, item.slug);
      failed.push({ id: item.id, slug: item.slug, reason: "detail" });
      continue;
    }

    const idx = String(prefixNum).padStart(2, "0");
    prefixNum += 1;
    const localPaths = [];
    for (let n = 0; n < d.imgs.length; n++) {
      const remotePath = d.imgs[n];
      const ext = path.extname(remotePath).toLowerCase() || ".jpg";
      const file = `p${idx}-${n + 1}${ext === ".jpeg" ? ".jpg" : ext}`;
      try {
        const size = await download(base + remotePath, path.join(prodDir, file));
        localPaths.push(`/products/${file}`);
        console.log(`IMG OK ${file} (${size})`);
      } catch (e) {
        console.log(`IMG FAIL ${file}`, e.message || e);
      }
    }

    if (!localPaths.length) {
      console.log("NO IMG", item.id, item.slug);
      failed.push({ id: item.id, slug: item.slug, reason: "no-image" });
    }

    const price = d.price || 0;
    const row = {
      slug: item.slug,
      sku: d.sku,
      name: d.name,
      description: d.desc || d.name,
      price,
      oldPrice: item.onSale && price ? Math.round(price * 1.12) : null,
      brandName: item.brand,
      brandSlug: item.brandSlug,
      categorySlug: item.cat,
      imageUrl: localPaths[0] || null,
      externalId: `1c-${item.id}`,
      featured: item.featured,
      isNew: item.isNew,
      onSale: !!item.onSale,
      stock: 20 + (item.id % 80),
      sourceId: item.id,
      images: localPaths,
      theme: item.theme,
    };
    if (item.variantGroup) {
      row.variantGroup = item.variantGroup;
      row.variantLabel = item.variantLabel;
    }
    if (item.id === 547976 || item.id === 547977) {
      row.variantGroup = "deli-urbanroot-drawers";
    }

    existing.push(row);
    added.push(row);
    byTheme[item.theme] = (byTheme[item.theme] || 0) + 1;
    console.log(`OK ${item.theme} ${row.slug} | ${row.price} | ${row.name.slice(0, 70)}`);
  }

  for (const p of existing) {
    if (p.slug === "podstavka-deli-urbanroot-yashiki-golubaya") {
      p.variantGroup = p.variantGroup || "deli-urbanroot-drawers";
      p.variantLabel = p.variantLabel || "Голубая";
    }
    if (p.slug === "pudra-cretacolor-grafit") {
      p.variantGroup = p.variantGroup || "cretacolor-powder";
      p.variantLabel = p.variantLabel || "Графит";
    }
  }

  writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf8");
  writeFileSync(
    path.join(process.cwd(), "tmp-sync-news-report.json"),
    JSON.stringify({ added: added.map((a) => a.slug), failed, byTheme, total: existing.length }, null, 2),
    "utf8",
  );
  console.log("\nSAVED products.json total=", existing.length, "added=", added.length);
  console.log("byTheme", byTheme);
  console.log("failed", failed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
