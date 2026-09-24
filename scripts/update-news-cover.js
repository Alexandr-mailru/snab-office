const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.news.findUnique({
    where: { slug: "shkolnyj-bazar" },
    select: { id: true, slug: true, coverImage: true, title: true },
  });
  console.log("BEFORE:", JSON.stringify(before, null, 2));

  if (!before) {
    throw new Error('News row with slug "shkolnyj-bazar" not found');
  }

  const updated = await prisma.news.update({
    where: { slug: "shkolnyj-bazar" },
    data: { coverImage: "/news/gallery/657642-2.jpg" },
    select: { id: true, slug: true, coverImage: true, title: true },
  });
  console.log("AFTER:", JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
