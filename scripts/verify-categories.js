const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const roots = await p.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      slug: true,
      children: {
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          _count: { select: { children: true } },
        },
      },
    },
  });
  for (const r of roots) {
    const leaves = r.children.reduce((n, g) => n + g._count.children, 0);
    console.log(`${r.name} (${r.children.length} групп, ${leaves} листьев)`);
  }
  const office = roots[0];
  console.log("\nОфис — первые 2 группы:");
  for (const g of office.children.slice(0, 2)) {
    console.log(" ", g.name, "→", g._count.children, "подкатегорий");
  }
  const products = await p.product.findMany({
    select: { name: true, category: { select: { name: true, slug: true } } },
  });
  console.log("\nТовары:");
  for (const pr of products) {
    console.log(`- ${pr.category?.name}: ${pr.name.slice(0, 50)}`);
  }
  await p.$disconnect();
})();
