const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: "Urbanroot" } },
        { name: { contains: "Cretacolor" } },
        { name: { contains: "Maped" } },
        { name: { contains: "Infinity" } },
        { name: { contains: "гуашь" } },
        { name: { contains: "карандаш" } },
        { name: { contains: "тетрад" } },
      ],
    },
    select: { slug: true, name: true },
    take: 50,
  });
  console.log(rows.map((r) => `${r.slug} | ${r.name}`).join("\n"));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
