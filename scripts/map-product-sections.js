const fs = require("fs");
const products = JSON.parse(fs.readFileSync("prisma/data/products.json", "utf8"));
const flat = JSON.parse(fs.readFileSync("prisma/data/snaboffice-category-flat.json", "utf8"));
const byId = Object.fromEntries(flat.map((c) => [c.id, c]));

async function sectionForElement(id) {
  const url = `https://xn--80aqgg1a.xn--p1ai/catalog/detail/?ELEMENT_ID=${id}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 snab-office-sync" },
  });
  const html = await res.text();
  const crumbs = [...html.matchAll(/SECTION_ID=(\d+)[^>]*title="([^"]+)"/g)].map((m) => ({
    id: m[1],
    name: m[2],
  }));
  // deepest crumb known in our tree (mega-menu hierarchy)
  let leafId = null;
  let leafName = null;
  let slug = null;
  for (let i = crumbs.length - 1; i >= 0; i--) {
    const hit = byId[crumbs[i].id];
    if (hit) {
      leafId = crumbs[i].id;
      leafName = crumbs[i].name;
      slug = hit.slug;
      break;
    }
  }
  return { crumbs, leafId, leafName, slug };
}

(async () => {
  const out = [];
  for (const p of products) {
    const eid = String(p.externalId || "").replace(/^1c-/, "");
    if (!eid) continue;
    try {
      const info = await sectionForElement(eid);
      out.push({
        productSlug: p.slug,
        elementId: eid,
        leafId: info.leafId,
        leafName: info.leafName,
        categorySlug: info.slug || p.categorySlug,
        crumbs: info.crumbs,
      });
      console.log(eid, "->", info.leafId, info.leafName, info.slug || "NO SLUG");
    } catch (e) {
      console.error(eid, e.message);
      out.push({ productSlug: p.slug, elementId: eid, error: e.message });
    }
  }
  fs.writeFileSync("prisma/data/product-section-map.json", JSON.stringify(out, null, 2));
  console.log("wrote", out.length);
})();
