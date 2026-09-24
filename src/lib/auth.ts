import { createHmac, timingSafeEqual } from "crypto";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { COMPANY } from "@/lib/company";
import { buildCategoryTree } from "@/lib/categoryTree";
import { prisma } from "@/lib/prisma";

export { COMPANY };

export const SESSION_COOKIE = "snaboffice_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production");
    }
    return "snaboffice-dev-session-secret-change-me";
  }
  return secret;
}

export function signSession(userId: string, ttlSec = SESSION_TTL_SEC) {
  const exp = String(Math.floor(Date.now() / 1000) + ttlSec);
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig) return null;

  const payload = `${userId}.${exp}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return null;
  return userId;
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SEC) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export function setSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, signSession(userId), sessionCookieOptions());
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
}

export async function getSessionUser() {
  const jar = await cookies();
  const userId = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyName: true,
        inn: true,
        buyAsOrg: true,
      },
    });
  } catch {
    return null;
  }
}

export const getCategoryTree = cache(async () => {
  try {
    return await unstable_cache(
      async () => {
        const categories = await prisma.category.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            _count: { select: { products: true } },
          },
        });
        return buildCategoryTree(categories);
      },
      ["snaboffice-category-tree-v3"],
      { revalidate: 120 },
    )();
  } catch {
    return [];
  }
});
