import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * App traffic on Vercel must use the Prisma Postgres pooler.
 * Keep migrate/deploy on the direct `db.prisma.io` URL from DATABASE_URL.
 */
function resolveAppDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (url.hostname === "db.prisma.io") {
    url.hostname = "pooled.db.prisma.io";
  }

  const usingPooler = url.hostname.includes("pooled");
  if (usingPooler && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  // One TCP connection per serverless isolate — enough for ~5 concurrent browsers
  // when instances stay warm and share this singleton.
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "10");
  }
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

function createPrismaClient() {
  const url = resolveAppDatabaseUrl(process.env.DATABASE_URL);

  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
