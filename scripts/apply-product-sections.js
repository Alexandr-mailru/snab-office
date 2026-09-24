const fs = require("fs");

const products = JSON.parse(fs.readFileSync("prisma/data/products.json", "utf8"));
const map = JSON.parse(fs.readFileSync("prisma/data/product-section-map.json", "utf8"));
const flat = JSON.parse(fs.readFileSync("prisma/data/snaboffice-category-flat.json", "utf8"));
const byId = Object.fromEntries(flat.map((c) => [c.id, c]));

function resolveSlug(entry) {
  if (!entry || entry.error) return null;
  if (entry.leafId && byId[entry.leafId]) return byId[entry.leafId].slug;
  const crumbs = entry.crumbs || [];
  for (let i = crumbs.length - 1; i >= 0; i--) {
    const hit = byId[crumbs[i].id];
    if (hit) return hit.slug;
  }
  return null;
}

const byProduct = Object.fromEntries(map.map((m) => [m.productSlug, m]));
let changed = 0;
for (const p of products) {
  const slug = resolveSlug(byProduct[p.slug]);
  if (slug && slug !== p.categorySlug) {
    console.log(p.slug, p.categorySlug, "->", slug);
    p.categorySlug = slug;
    changed++;
  } else if (slug) {
    p.categorySlug = slug;
  }
}

fs.writeFileSync("prisma/data/products.json", JSON.stringify(products, null, 2) + "\n");

// refresh map categorySlug with resolved values
for (const entry of map) {
  const slug = resolveSlug(entry);
  if (slug) entry.categorySlug = slug;
}
fs.writeFileSync("prisma/data/product-section-map.json", JSON.stringify(map, null, 2) + "\n");

const counts = {};
for (const p of products) counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
console.log("changed", changed);
console.log(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}`)
    .join("\n"),
);
