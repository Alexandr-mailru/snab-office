const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const cats = await p.category.findMany({
    where: { parentId: null },
    select: { slug: true, name: true, _count: { select: { products: true } } },
  });
  console.log(cats);
  const art = await p.product.findMany({
    where: {
      active: true,
      OR: [
        { category: { slug: "hudozhestvennye" } },
        { category: { slug: "shkola" } },
        { isNew: true },
        { featured: true },
      ],
    },
    select: {
      slug: true,
      name: true,
      category: { select: { slug: true } },
    },
    take: 16,
  });
  console.log(
    art.map((x) => `${x.category.slug} | ${x.slug} | ${x.name.slice(0, 45)}`).join("\n"),
  );
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
