import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();
const dataPath = path.join(process.cwd(), "prisma", "data", "products.json");

const CATEGORY_FALLBACK = {
  karandashi: "kancelyariya",
  tetradi: "bumaga",
  "bumaga-a4": "bumaga",
  kraski: "hudozhestvennye",
  pudry: "hudozhestvennye",
  "shkolnaya-kanc": "shkola",
};

function inferColor(name, variantLabel) {
  const text = `${variantLabel || ""} ${name || ""}`.toLowerCase();
  if (/розов/.test(text)) return "Розовая";
  if (/зелён|зелен/.test(text)) return "Зелёная";
  if (/голуб|син/.test(text)) return "Голубая";
  if (/жёлт|желт/.test(text)) return "Жёлтая";
  return variantLabel || null;
}

function inferFormat(name, description) {
  const text = `${name} ${description}`;
  const m = text.match(/\bA[345]\b/i);
  return m ? m[0].toUpperCase() : null;
}

async function ensureBrand(slug, name) {
  return prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
}

async function ensureCategory(slug, fallbackSlug) {
  let cat = await prisma.category.findUnique({ where: { slug } });
  if (cat) return cat;
  if (fallbackSlug) {
    cat = await prisma.category.findUnique({ where: { slug: fallbackSlug } });
    if (cat) return cat;
  }
  const parent = await prisma.category.findUnique({ where: { slug: "kancelyariya" } });
  return prisma.category.create({
    data: {
      slug,
      name: slug,
      parentId: parent?.id,
      sortOrder: 99,
    },
  });
}

async function main() {
  if (!existsSync(dataPath)) throw new Error("products.json missing");
  const rows = JSON.parse(readFileSync(dataPath, "utf8"));

  let created = 0;
  let updated = 0;
  const errors = [];

  for (const row of rows) {
    try {
      const brand = await ensureBrand(row.brandSlug, row.brandName);
      const fallback = CATEGORY_FALLBACK[row.categorySlug] || null;
      const category = await ensureCategory(row.categorySlug, fallback);

      const imagesJson = JSON.stringify(row.images || (row.imageUrl ? [row.imageUrl] : []));
      const data = {
        sku: row.sku,
        name: row.name,
        description: row.description,
        price: row.price,
        oldPrice: row.oldPrice,
        stock: row.stock ?? 0,
        brandName: row.brandName,
        brandId: brand.id,
        imageUrl: row.imageUrl,
        images: imagesJson,
        featured: !!row.featured,
        isNew: !!row.isNew,
        onSale: !!row.onSale,
        variantGroup: row.variantGroup ?? null,
        variantLabel: row.variantLabel ?? null,
        color: inferColor(row.name, row.variantLabel),
        format: inferFormat(row.name, row.description),
        categoryId: category.id,
        externalId: row.externalId,
        active: true,
      };

      const existing =
        (await prisma.product.findUnique({ where: { slug: row.slug } })) ||
        (row.externalId
          ? await prisma.product.findUnique({ where: { externalId: row.externalId } })
          : null);

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { ...data, slug: row.slug },
        });
        updated += 1;
      } else {
        await prisma.product.create({
          data: { ...data, slug: row.slug },
        });
        created += 1;
      }
    } catch (e) {
      errors.push({ slug: row.slug, error: String(e.message || e) });
      console.error("UPSERT FAIL", row.slug, e.message || e);
    }
  }

  const total = await prisma.product.count();
  console.log(JSON.stringify({ created, updated, total, errors }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
