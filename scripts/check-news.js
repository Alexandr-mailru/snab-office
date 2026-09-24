const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });
  console.log(
    JSON.stringify(
      rows.map((r) => ({
        slug: r.slug,
        cover: r.coverImage,
        bodyLen: r.body.length,
        excerpt: r.excerpt.slice(0, 60),
      })),
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
