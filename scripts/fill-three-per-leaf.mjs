/**
 * Scrape 3 products from snaboffice.rf into every leaf subcategory.
 * Usage:
 *   node scripts/fill-three-per-leaf.mjs              # scrape → JSON
 *   node scripts/fill-three-per-leaf.mjs --resume      # continue scrape
 *   node scripts/fill-three-per-leaf.mjs --db          # upsert local DB
 *   node scripts/fill-three-per-leaf.mjs --db --prod   # upsert prod DB (pooled)
 */
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const wantProd = process.argv.includes("--prod");
const wantDb = process.argv.includes("--db");
const resume = process.argv.includes("--resume");
const perLeaf = Number(process.argv.find((a) => a.startsWith("--n="))?.slice(3) || 3);

config({ path: ".env" });
if (wantProd) config({ path: ".env.postgres", override: true });

const base = "https://xn--80aqgg1a.xn--p1ai";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; snab-office-fill/1.0)" };
const treePath = path.join(process.cwd(), "prisma", "data", "snaboffice-category-tree.json");
const outPath = path.join(process.cwd(), "prisma", "data", "leaf-fill-products.json");
const progressPath = path.join(process.cwd(), "prisma", "data", "leaf-fill-progress.json");

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

function slugify(name, id) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const baseSlug = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${baseSlug || "tovar"}-${id}`;
}

function brandSlugFromName(name) {
  if (!name) return "snaboffice";
  return slugify(name, "b").replace(/-b$/, "") || "snaboffice";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function collectLeaves(tree) {
  const leaves = [];
  function walk(node) {
    const kids = node.children || [];
    if (!kids.length) {
      leaves.push({ id: node.id, slug: node.slug, name: node.name });
      return;
    }
    for (const c of kids) walk(c);
  }
  for (const root of tree) {
    for (const g of root.groups || []) {
      for (const c of g.children || []) walk(c);
    }
  }
  return leaves;
}

/** Prefer ids that look like catalog items (from product cards). */
async function productIdsInSection(sectionId) {
  const html = await fetchText(`${base}/catalog/?SECTION_ID=${sectionId}`);
  // Prefer links near product titles / detail URLs in listing
  const fromDetail = [
    ...html.matchAll(/catalog\/detail\/\?ELEMENT_ID=(\d+)/gi),
  ].map((m) => m[1]);
  const all = [...html.matchAll(/ELEMENT_ID=(\d+)/g)].map((m) => m[1]);
  const ordered = [...new Set([...fromDetail, ...all])];
  return ordered;
}

async function parseDetail(id) {
  const html = await fetchText(`${base}/catalog/detail/?ELEMENT_ID=${id}`);
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = nameMatch ? decodeHtml(nameMatch[1].replace(/<[^>]+>/g, "")) : null;
  if (!name || /ошибка|не найден/i.test(name)) return null;

  const fromFancy = [...html.matchAll(/data-fancybox="images"[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const fromSrc = [...html.matchAll(/src="(\/upload\/iblock\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map(
    (m) => m[1],
  );
  const imgs = [...fromFancy, ...fromSrc]
    .map((u) => (u.startsWith("http") ? new URL(u).pathname : u))
    .filter((u) => /\/upload\/iblock\//i.test(u) && !/nopic/i.test(u))
    .map((u) => u.replace(/\.resize2\./i, ".resize1."));
  const img = [...new Set(imgs)][0] || null;

  const priceMatch = html.match(/Цена:<\/span>\s*([\d\s]+)/);
  const price = priceMatch ? Number(priceMatch[1].replace(/\s/g, "")) : 0;
  const skuMatch = html.match(/Артикул:<\/span>\s*([^<\s]+)/);
  const sku = skuMatch ? skuMatch[1].trim() : `AMX-${id}`;

  let brandName = null;
  const brandMatch =
    html.match(/Бренд:<\/span>\s*<[^>]+>([^<]+)/i) || html.match(/Бренд:<\/span>\s*([^<]+)/i);
  if (brandMatch) brandName = decodeHtml(brandMatch[1]);

  let desc = "";
  const descMatch = html.match(/В наличии[\s\S]{0,220}<p>\s*(?:<br\s*\/?>\s*)*([\s\S]{40,900}?)<\/p>/i);
  if (descMatch) desc = decodeHtml(descMatch[1].replace(/<[^>]+>/g, " "));
  if (desc.length < 30) desc = name;

  return { id, name, img, price, sku, brandName, desc };
}

function toRow(d, cat) {
  const brandName = d.brandName || "СнабОфис";
  const imageUrl = d.img ? `${base}${d.img}` : null;
  return {
    slug: slugify(d.name, d.id),
    sku: d.sku,
    name: d.name,
    description: d.desc,
    price: d.price || 99,
    oldPrice: null,
    brandName,
    brandSlug: brandSlugFromName(brandName),
    categorySlug: cat.slug,
    categoryExternalId: cat.id,
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    externalId: `1c-${d.id}`,
    featured: false,
    isNew: true,
    onSale: false,
    stock: 12 + (Number(d.id) % 40),
    sourceId: Number(d.id),
    leafFill: true,
  };
}

function saveProgress(doneSlugs, rows) {
  writeFileSync(progressPath, JSON.stringify({ doneSlugs: [...doneSlugs] }, null, 2), "utf8");
  writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
}

async function scrape() {
  const tree = JSON.parse(readFileSync(treePath, "utf8"));
  const leaves = collectLeaves(tree);
  let rows = [];
  const doneSlugs = new Set();
  const usedSource = new Set();

  if (resume && existsSync(outPath)) {
    rows = JSON.parse(readFileSync(outPath, "utf8"));
    for (const r of rows) {
      doneSlugs.add(r.categorySlug);
      if (r.sourceId) usedSource.add(String(r.sourceId));
    }
    console.log(`Resume: ${rows.length} products, ${doneSlugs.size} leaves done`);
  }

  console.log(`Leaves: ${leaves.length}, target ${perLeaf} each`);

  let i = 0;
  for (const cat of leaves) {
    i += 1;
    if (doneSlugs.has(cat.slug)) continue;

    // Drop previous partial rows for this leaf if any
    rows = rows.filter((r) => r.categorySlug !== cat.slug);

    try {
      const ids = await productIdsInSection(cat.id);
      await sleep(50);
      const picked = [];
      for (const candidate of ids) {
        if (usedSource.has(String(candidate))) continue;
        try {
          const d = await parseDetail(candidate);
          await sleep(40);
          if (!d) continue;
          usedSource.add(String(candidate));
          picked.push(toRow(d, cat));
          if (picked.length >= perLeaf) break;
        } catch (e) {
          if (/HTTP 404/.test(e.message)) continue;
          throw e;
        }
      }

      if (!picked.length) {
        console.log(`[${i}/${leaves.length}] EMPTY ${cat.name}`);
      } else {
        rows.push(...picked);
        console.log(
          `[${i}/${leaves.length}] ${cat.slug} ← ${picked.length}: ${picked.map((p) => p.name.slice(0, 28)).join(" | ")}`,
        );
      }
      doneSlugs.add(cat.slug);
      if (i % 10 === 0) saveProgress(doneSlugs, rows);
    } catch (e) {
      console.log(`[${i}/${leaves.length}] ERR ${cat.slug}: ${e.message}`);
      await sleep(200);
    }
  }

  saveProgress(doneSlugs, rows);
  console.log(`Scraped ${rows.length} products across ${doneSlugs.size} leaves`);
  return rows;
}

async function upsertDb(rows) {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL missing");
  const u = new URL(raw);
  if (u.hostname === "db.prisma.io") {
    u.hostname = "pooled.db.prisma.io";
    u.searchParams.set("pgbouncer", "true");
    u.searchParams.set("connection_limit", "1");
  }
  process.env.DATABASE_URL = u.toString();
  console.log("Upsert host", u.hostname, "rows", rows.length);

  const prisma = new PrismaClient();
  try {
    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
    const brandBySlug = Object.fromEntries((await prisma.brand.findMany()).map((b) => [b.slug, b]));

    let upserted = 0;
    let skipped = 0;
    for (const row of rows) {
      const categoryId = bySlug[row.categorySlug];
      if (!categoryId) {
        skipped += 1;
        continue;
      }
      let brand = brandBySlug[row.brandSlug];
      if (!brand) {
        brand = await prisma.brand.upsert({
          where: { slug: row.brandSlug },
          create: { slug: row.brandSlug, name: row.brandName, sortOrder: 8000 + upserted },
          update: { name: row.brandName },
        });
        brandBySlug[row.brandSlug] = brand;
      }
      const images = row.images?.length ? row.images : row.imageUrl ? [row.imageUrl] : [];
      try {
        await prisma.product.upsert({
          where: { externalId: row.externalId },
          create: {
            slug: row.slug,
            sku: row.sku,
            name: row.name,
            description: row.description,
            price: row.price,
            stock: row.stock,
            brandName: row.brandName,
            brandId: brand.id,
            imageUrl: images[0] ?? undefined,
            images: JSON.stringify(images),
            featured: false,
            isNew: true,
            onSale: false,
            categoryId,
            externalId: row.externalId,
          },
          update: {
            name: row.name,
            description: row.description,
            price: row.price,
            stock: row.stock,
            brandName: row.brandName,
            brandId: brand.id,
            imageUrl: images[0] ?? undefined,
            images: JSON.stringify(images),
            categoryId,
            active: true,
          },
        });
        upserted += 1;
      } catch {
        await prisma.product.upsert({
          where: { externalId: row.externalId },
          create: {
            slug: `${row.slug}-f`,
            sku: row.sku,
            name: row.name,
            description: row.description,
            price: row.price,
            stock: row.stock,
            brandName: row.brandName,
            brandId: brand.id,
            imageUrl: images[0] ?? undefined,
            images: JSON.stringify(images),
            featured: false,
            isNew: true,
            onSale: false,
            categoryId,
            externalId: row.externalId,
          },
          update: {
            name: row.name,
            categoryId,
            imageUrl: images[0] ?? undefined,
            images: JSON.stringify(images),
            active: true,
          },
        });
        upserted += 1;
      }
      if (upserted % 50 === 0) console.log(`… ${upserted}/${rows.length}`);
    }
    console.log({ upserted, skipped, total: rows.length });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (wantDb) {
    if (!existsSync(outPath)) throw new Error("Run scrape first (no leaf-fill-products.json)");
    const rows = JSON.parse(readFileSync(outPath, "utf8"));
    await upsertDb(rows);
    return;
  }
  await scrape();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
