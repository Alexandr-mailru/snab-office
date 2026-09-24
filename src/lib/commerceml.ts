import { prisma } from "@/lib/prisma";

function pickAll(xml: string, tag: string) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  return [...xml.matchAll(re)].map((m) => m[1].trim());
}

function pickOne(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

function parsePrice(block: string) {
  const price = pickOne(block, "ЦенаЗаЕдиницу") || pickOne(block, "Цена");
  const num = Number(String(price).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? Math.round(num) : 0;
}

export async function importCommerceML(xml: string) {
  const groupBlocks = pickAll(xml, "Группа");
  let categories = 0;
  let products = 0;

  for (const group of groupBlocks) {
    const externalId = pickOne(group, "Ид");
    const name = pickOne(group, "Наименование");
    if (!externalId || !name) continue;

    await prisma.category.upsert({
      where: { externalId },
      create: {
        externalId,
        name,
        slug: slugify(name),
        description: name,
      },
      update: { name },
    });
    categories += 1;
  }

  const productBlocks = pickAll(xml, "Товар");
  for (const product of productBlocks) {
    const externalId = pickOne(product, "Ид");
    const name = pickOne(product, "Наименование");
    if (!externalId || !name) continue;

    const description = pickOne(product, "Описание") || name;
    const sku = pickOne(product, "Артикул") || null;
    const groupsBlock = pickOne(product, "Группы");
    const categoryExternalId = groupsBlock
      ? groupsBlock.match(/<Ид>([\s\S]*?)<\/Ид>/i)?.[1]?.trim() || ""
      : "";

    let category = categoryExternalId
      ? await prisma.category.findUnique({ where: { externalId: categoryExternalId } })
      : null;

    if (!category) {
      category = await prisma.category.upsert({
        where: { slug: "import" },
        create: {
          slug: "import",
          name: "Импорт из 1С",
          externalId: "import-root",
          description: "Товары, загруженные из CommerceML без группы",
        },
        update: {},
      });
    }

    const priceBlock = pickOne(product, "Цены") || product;
    const price = parsePrice(priceBlock) || parsePrice(product);

    await prisma.product.upsert({
      where: { externalId },
      create: {
        externalId,
        slug: slugify(`${name}-${externalId.slice(0, 8)}`),
        sku,
        name,
        description,
        price: price || 0,
        stock: 0,
        categoryId: category.id,
        active: true,
      },
      update: {
        sku,
        name,
        description,
        price: price || undefined,
        categoryId: category.id,
        active: true,
      },
    });
    products += 1;
  }

  // Offers file often has stocks/prices separately
  const offerBlocks = pickAll(xml, "Предложение");
  for (const offer of offerBlocks) {
    const externalId = pickOne(offer, "Ид");
    if (!externalId) continue;
    const price = parsePrice(offer);
    const qtyRaw = pickOne(offer, "Количество").replace(",", ".");
    const quantity = qtyRaw ? Number(qtyRaw) : NaN;

    const existing = await prisma.product.findUnique({ where: { externalId } });
    if (!existing) continue;

    await prisma.product.update({
      where: { externalId },
      data: {
        price: price || existing.price,
        stock: Number.isFinite(quantity) ? Math.round(quantity) : existing.stock,
      },
    });
  }

  return { categories, products: products + offerBlocks.length };
}
