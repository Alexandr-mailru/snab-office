import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const wantProd = process.argv.includes("--db") || process.argv.includes("--prod");
config({ path: ".env" });
if (wantProd) {
  // Production Prisma Postgres — must win over local DATABASE_URL
  config({ path: ".env.postgres", override: true });
} else {
  config({ path: ".env.postgres" });
}

const base = "https://xn--80aqgg1a.xn--p1ai";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; snab-office-demo/1.0)" };
const flatPath = path.join(process.cwd(), "prisma", "data", "snaboffice-category-flat.json");
const productsPath = path.join(process.cwd(), "prisma", "data", "products.json");
const outPath = path.join(process.cwd(), "prisma", "data", "category-demo-products.json");

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
  const s = slugify(name, "b").replace(/-b$/, "");
  return s || "snaboffice";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function productIdsInSection(sectionId) {
  const html = await fetchText(`${base}/catalog/?SECTION_ID=${sectionId}`);
  return [...new Set([...html.matchAll(/ELEMENT_ID=(\d+)/g)].map((m) => m[1]))];
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
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    externalId: `1c-${d.id}`,
    featured: false,
    isNew: true,
    onSale: false,
    stock: 15 + (Number(d.id) % 40),
    sourceId: Number(d.id),
    demoFill: true,
  };
}

async function main() {
  const flat = JSON.parse(readFileSync(flatPath, "utf8"));
  const leaves = flat.filter((c) => c.level === 2);
  const existing = existsSync(productsPath)
    ? JSON.parse(readFileSync(productsPath, "utf8"))
    : [];
  const usedSource = new Set(
    existing
      .filter((p) => !p.demoFill)
      .map((p) => String(p.sourceId || p.externalId || "").replace(/\D/g, ""))
      .filter(Boolean),
  );
  // Also reserve ids already taken by demo rows we keep
  for (const p of existing.filter((p) => p.demoFill)) {
    const id = String(p.sourceId || p.externalId || "").replace(/\D/g, "");
    if (id) usedSource.add(id);
  }

  const onlyMissing = process.argv.includes("--missing");
  const coveredSlugs = new Set(existing.map((p) => p.categorySlug));
  const targets = onlyMissing ? leaves.filter((c) => !coveredSlugs.has(c.slug)) : leaves;

  // Fill every leaf so each category shows at least one product from snaboffice.rf
  console.log(`Leaf categories: ${leaves.length}, targets: ${targets.length}`);

  const demo = onlyMissing
    ? existing.filter((p) => p.demoFill)
    : [];
  let i = 0;
  for (const cat of targets) {
    i += 1;
    try {
      const ids = await productIdsInSection(cat.id);
      await sleep(80);
      let row = null;
      for (const candidate of ids) {
        if (usedSource.has(String(candidate))) continue;
        try {
          const d = await parseDetail(candidate);
          await sleep(80);
          if (!d) continue;
          usedSource.add(String(candidate));
          row = toRow(d, cat);
          console.log(`[${i}/${targets.length}] OK ${cat.slug} <- ${d.name.slice(0, 55)}`);
          break;
        } catch (e) {
          if (/HTTP 404/.test(e.message)) continue;
          throw e;
        }
      }
      if (!row) {
        console.log(`[${i}/${targets.length}] ${ids.length ? "NO-VALID" : "EMPTY"} ${cat.name}`);
        continue;
      }
      // replace previous demo for this category if any
      const idx = demo.findIndex((p) => p.categorySlug === cat.slug);
      if (idx >= 0) demo[idx] = row;
      else demo.push(row);
    } catch (e) {
      console.log(`[${i}/${targets.length}] ERR ${cat.slug}: ${e.message}`);
      await sleep(300);
    }
  }

  writeFileSync(outPath, JSON.stringify(demo, null, 2), "utf8");
  const kept = existing.filter((p) => !p.demoFill);
  const merged = [...kept, ...demo];
  writeFileSync(productsPath, JSON.stringify(merged, null, 2), "utf8");
  console.log(`Scraped ${demo.length}. products.json = ${merged.length}`);

  if (!process.argv.includes("--db")) {
    console.log("Pass --db to upsert into DATABASE_URL");
    return;
  }

  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL || "").hostname;
    } catch {
      return "?";
    }
  })();
  console.log(`Upserting into DB host: ${dbHost}`);

  // Use pooled endpoint for bulk writes (same as app on Vercel)
  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.hostname === "db.prisma.io") u.hostname = "pooled.db.prisma.io";
      u.searchParams.set("pgbouncer", "true");
      u.searchParams.set("connection_limit", "1");
      u.searchParams.set("connect_timeout", "15");
      process.env.DATABASE_URL = u.toString();
      console.log(`Using pooled host: ${u.hostname}`);
    } catch {
      /* keep as-is */
    }
  }

  const prisma = new PrismaClient();
  try {
    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
    const brandBySlug = Object.fromEntries(
      (await prisma.brand.findMany()).map((b) => [b.slug, b]),
    );

    console.log(`Categories in DB: ${categories.length}`);

    let upserted = 0;
    for (const row of demo) {
      const categoryId = bySlug[row.categorySlug];
      if (!categoryId) {
        console.log("NO CAT", row.categorySlug);
        continue;
      }
      let brand = brandBySlug[row.brandSlug];
      if (!brand) {
        brand = await prisma.brand.upsert({
          where: { slug: row.brandSlug },
          create: { slug: row.brandSlug, name: row.brandName, sortOrder: 9000 + upserted },
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
        if (upserted % 20 === 0) console.log(`… ${upserted}/${demo.length}`);
      } catch (e) {
        // slug collision — retry with unique slug
        const slug = `${row.slug}-d`;
        try {
          await prisma.product.upsert({
            where: { externalId: row.externalId },
            create: {
              slug,
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
        } catch (e2) {
          console.log("FAIL", row.slug, e2.message?.slice?.(0, 120) || e2);
        }
      }
    }
    console.log(`DB upserted ${upserted}/${demo.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
