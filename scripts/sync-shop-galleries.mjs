import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import path from "path";

const base = "https://xn--80aqgg1a.xn--p1ai";
const prodDir = path.join(process.cwd(), "public", "products");
const dataPath = path.join(process.cwd(), "prisma", "data", "products.json");
mkdirSync(prodDir, { recursive: true });

function decodeHtml(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function preferFull(url) {
  return url.replace(/\.resize2\./i, ".resize1.");
}

async function download(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(filePath, buf);
  return buf.length;
}

async function galleryFromDetail(id) {
  const res = await fetch(`${base}/catalog/detail/?ELEMENT_ID=${id}`);
  const html = await res.text();

  const fromFancy = [...html.matchAll(/data-fancybox="images"[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const fromSrc = [...html.matchAll(/src="(\/upload\/iblock\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map((m) => m[1]);
  const all = [...fromFancy, ...fromSrc]
    .map((u) => (u.startsWith("http") ? new URL(u).pathname : u))
    .map(preferFull)
    .filter((u) => /\/upload\/iblock\//i.test(u) && !/nopic/i.test(u));

  const unique = [];
  const seen = new Set();
  for (const u of all) {
    const key = u.replace(/\.resize1\./i, ".").replace(/\.resize2\./i, ".");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(u);
    if (unique.length >= 6) break;
  }
  return unique;
}

async function main() {
  if (!existsSync(dataPath)) {
    throw new Error("prisma/data/products.json not found — run sync-snaboffice-products.mjs first");
  }
  const products = JSON.parse(readFileSync(dataPath, "utf8"));

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const idx = String(i + 1).padStart(2, "0");
    const sourceId = p.sourceId || Number(String(p.externalId || "").replace(/\D/g, ""));
    if (!sourceId) {
      console.log("SKIP no sourceId", p.slug);
      continue;
    }

    let remote = await galleryFromDetail(sourceId);
    if (!remote.length && p.imageUrl) {
      // keep existing single local as fallback later
      remote = [];
    }

    const localPaths = [];
    for (let n = 0; n < remote.length; n++) {
      const remotePath = remote[n];
      const ext = path.extname(remotePath).toLowerCase() || ".jpg";
      const file = `p${idx}-${n + 1}${ext === ".jpeg" ? ".jpg" : ext}`;
      const abs = path.join(prodDir, file);
      try {
        const size = await download(base + remotePath, abs);
        localPaths.push(`/products/${file}`);
        console.log(`OK ${p.slug} #${n + 1} (${size})`);
      } catch (e) {
        console.log(`FAIL ${p.slug} #${n + 1}`, e.message || e);
      }
    }

    // Always keep cover as first local image; fall back to previous cover file
    if (!localPaths.length && p.imageUrl) {
      localPaths.push(p.imageUrl);
    }

    p.images = localPaths;
    p.imageUrl = localPaths[0] || p.imageUrl || null;
    console.log(`${p.slug}: ${localPaths.length} photos`);
  }

  writeFileSync(dataPath, JSON.stringify(products, null, 2), "utf8");
  console.log("Updated products.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
