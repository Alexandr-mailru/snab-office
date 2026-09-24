import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SyncRow = {
  externalId?: string;
  sku?: string;
  price?: number;
  stock?: number;
  active?: boolean;
};

function isAuthorized(request: Request) {
  const token = process.env.ONEC_SYNC_TOKEN;
  if (!token) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { items?: SyncRow[] } | null;
  if (!body?.items?.length) {
    return NextResponse.json({ error: "items[] required" }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const row of body.items) {
    const where = row.externalId
      ? { externalId: row.externalId }
      : row.sku
        ? { sku: row.sku }
        : null;
    if (!where) {
      errors.push("Row without externalId/sku skipped");
      continue;
    }

    const data: { price?: number; stock?: number; active?: boolean } = {};
    if (typeof row.price === "number" && Number.isFinite(row.price) && row.price >= 0) {
      data.price = Math.round(row.price);
    }
    if (typeof row.stock === "number" && Number.isFinite(row.stock) && row.stock >= 0) {
      data.stock = Math.round(row.stock);
    }
    if (typeof row.active === "boolean") data.active = row.active;
    if (!Object.keys(data).length) continue;

    const res = await prisma.product.updateMany({ where, data });
    updated += res.count;
  }

  return NextResponse.json({ ok: true, updated, errors });
}
