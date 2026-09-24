const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({
    where: { OR: [{ name: { contains: "Maped" } }, { name: { contains: "Cretacolor" } }, { name: { contains: "Deli" } }] },
    select: { id: true, name: true },
  });
  console.log("brands", brands);
  for (const b of brands) {
    const products = await prisma.product.findMany({
      where: { brandId: b.id, active: true },
      select: { slug: true, name: true },
      take: 8,
    });
    console.log("\n==", b.name, products.length);
    console.log(products.map((p) => p.slug).join("\n"));
  }
  const school = await prisma.product.findMany({
    where: { active: true, category: { slug: "shkola" } },
    select: { slug: true, name: true },
    take: 6,
  });
  console.log("\n== school", school.map((p) => p.slug + " | " + p.name.slice(0, 50)).join("\n"));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
