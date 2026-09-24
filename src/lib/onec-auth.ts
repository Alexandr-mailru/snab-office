import { timingSafeEqual } from "crypto";

const MAX_IMPORT_BYTES = Number(process.env.ONEC_MAX_UPLOAD_BYTES || 10 * 1024 * 1024);

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function getOneCCredentials() {
  const user = process.env.ONEC_USER?.trim();
  const password = process.env.ONEC_PASSWORD ?? "";
  if (!user) return null;
  return { user, password };
}

export function isOneCAuthorized(request: Request) {
  const creds = getOneCCredentials();
  if (!creds) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);

  return safeEqual(user, creds.user) && safeEqual(password, creds.password);
}

export function oneCUnauthorized() {
  return new Response("failure\nauthorization required", {
    status: 401,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": 'Basic realm="SnabOffice 1C Exchange"',
    },
  });
}

export function oneCNotConfigured() {
  return new Response("failure\nONEC_USER/ONEC_PASSWORD not configured", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export { MAX_IMPORT_BYTES };
