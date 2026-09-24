/**
 * Upsert full SnabOffice category tree into DATABASE_URL (use --prod for .env.postgres).
 * Does not delete categories or products.
 */
import { readFileSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const wantProd = process.argv.includes("--prod") || process.argv.includes("--db");
config({ path: ".env" });
if (wantProd) config({ path: ".env.postgres", override: true });

const flatPath = path.join(process.cwd(), "prisma", "data", "snaboffice-category-flat.json");

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL missing");

  const u = new URL(raw);
  if (u.hostname === "db.prisma.io") {
    u.hostname = "pooled.db.prisma.io";
    u.searchParams.set("pgbouncer", "true");
    u.searchParams.set("connection_limit", "1");
  }
  process.env.DATABASE_URL = u.toString();
  console.log("DB host", u.hostname);

  const flat = JSON.parse(readFileSync(flatPath, "utf8"));
  // Parents before children
  flat.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "ru"));

  const prisma = new PrismaClient();
  const idByExternal = new Map();

  try {
    const existing = await prisma.category.findMany({
      select: { id: true, externalId: true, slug: true },
    });
    for (const c of existing) {
      if (c.externalId) idByExternal.set(c.externalId, c.id);
    }

    let created = 0;
    let updated = 0;

    for (const [i, row] of flat.entries()) {
      const parentDbId = row.parentId ? idByExternal.get(row.parentId) : null;
      if (row.parentId && !parentDbId) {
        console.log("SKIP no parent yet", row.slug, "parent", row.parentId);
        continue;
      }

      const found = idByExternal.get(row.id);
      const data = {
        slug: row.slug,
        description: row.name,
        parentId: parentDbId,
        sortOrder: i + 1,
        externalId: row.id,
      };

      if (found) {
        await prisma.category.update({
          where: { id: found },
          data: {
            ...data,
            // Keep short menu labels on roots; update name only for nested nodes
            ...(row.level > 0 ? { name: row.name } : {}),
          },
        });
        updated += 1;
      } else {
        // slug may collide with old row without externalId
        const bySlug = await prisma.category.findUnique({ where: { slug: row.slug } });
        if (bySlug) {
          await prisma.category.update({
            where: { id: bySlug.id },
            data: {
              ...data,
              ...(row.level > 0 ? { name: row.name } : {}),
            },
          });
          idByExternal.set(row.id, bySlug.id);
          updated += 1;
        } else {
          const createdRow = await prisma.category.create({
            data: {
              ...data,
              name: row.name,
            },
          });
          idByExternal.set(row.id, createdRow.id);
          created += 1;
        }
      }

      if ((created + updated) % 50 === 0) {
        console.log(`… ${created + updated}/${flat.length}`);
      }
    }

    const total = await prisma.category.count();
    console.log({ created, updated, total, flat: flat.length });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
