/**
 * Expand SnabOffice category tree with nested sections from
 * #catalog-section-list tiles only (true 4+ level hierarchy).
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const base = "https://xn--80aqgg1a.xn--p1ai";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; snab-office-cat/1.0)" };
const treePath = path.join(process.cwd(), "prisma", "data", "snaboffice-category-tree.json");
const flatPath = path.join(process.cwd(), "prisma", "data", "snaboffice-category-flat.json");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decode(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name, id) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const baseSlug = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 70);
  return `${baseSlug || "sec"}-${id}`;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/**
 * Only tiles inside #catalog-section-list with .section_name.
 * These are real subsections (e.g. «Бумага офисная» under 1118).
 */
function parseSectionList(html) {
  const start = html.indexOf('id="catalog-section-list"');
  if (start < 0) return [];

  // Bound the block: list ends before product listing / filters typically
  let end = html.indexOf('id="c_catalog_items"', start);
  if (end < 0) end = html.indexOf("catalog-section-list", start + 30);
  if (end < 0) end = Math.min(html.length, start + 20000);
  // Prefer closing after last section col within a reasonable window
  const windowHtml = html.slice(start, Math.min(html.length, start + 25000));
  const lastCol = windowHtml.lastIndexOf('class="section_name"');
  const block =
    lastCol > 0
      ? windowHtml.slice(0, lastCol + 200)
      : html.slice(start, end > start ? end : start + 8000);

  const out = [];
  const seen = new Set();
  const re =
    /href="\/catalog\/\?SECTION_ID=(\d+)"[\s\S]*?class="section_name"\s*>\s*<span>([^<]+)<\/span>/gi;

  for (const m of block.matchAll(re)) {
    const id = m[1];
    const name = decode(m[2]);
    if (!id || seen.has(id) || !name) continue;
    // Skip absurdly long names (parser slip)
    if (name.length > 120) continue;
    seen.add(id);
    out.push({
      id,
      name,
      slug: slugify(name, id),
      children: [],
    });
  }
  return out;
}

async function expandNode(node, depth, maxDepth, stats, parentIds) {
  if (depth >= maxDepth) return;
  if (parentIds.has(node.id)) return;

  try {
    const html = await fetchText(`${base}/catalog/?SECTION_ID=${node.id}`);
    await sleep(60);
    stats.fetched += 1;
    let kids = parseSectionList(html);
    // Guard against bad parses / circular menus
    kids = kids.filter((k) => k.id !== node.id && !parentIds.has(k.id));
    if (kids.length > 40) {
      console.log(`WARN ${node.id} ${node.name}: ${kids.length} kids, truncating check`);
      // Still accept if they look like real tiles (short names)
      kids = kids.filter((k) => k.name.length <= 80);
      if (kids.length > 40) {
        stats.skippedLarge += 1;
        console.log(`SKIP large ${node.name}`);
        return;
      }
    }
    if (!kids.length) {
      stats.leaves += 1;
      node.children = [];
      return;
    }
    stats.expanded += 1;
    node.children = kids;
    console.log(`${"  ".repeat(Math.max(0, depth - 1))}${node.name} → ${kids.length}`);
    const nextParents = new Set(parentIds);
    nextParents.add(node.id);
    for (const kid of kids) {
      await expandNode(kid, depth + 1, maxDepth, stats, nextParents);
    }
  } catch (e) {
    stats.errors += 1;
    console.log(`ERR ${node.id} ${node.name}: ${e.message}`);
    await sleep(200);
  }
}

function flatten(tree) {
  const flat = [];
  function walk(node, level, parentId) {
    flat.push({
      id: node.id,
      slug: node.slug,
      name: node.name,
      level,
      ...(parentId ? { parentId } : {}),
    });
    for (const c of node.children || []) walk(c, level + 1, node.id);
  }
  for (const root of tree) {
    flat.push({ id: root.id, slug: root.slug, name: root.name, level: 0 });
    for (const g of root.groups || []) {
      flat.push({
        id: g.id,
        slug: g.slug,
        name: g.name,
        level: 1,
        parentId: root.id,
      });
      for (const leaf of g.children || []) {
        walk(leaf, 2, g.id);
      }
    }
  }
  return flat;
}

async function main() {
  // Quick self-check on 1118
  if (process.argv.includes("--probe")) {
    const html = await fetchText(`${base}/catalog/?SECTION_ID=1118`);
    const kids = parseSectionList(html);
    console.log(
      kids.map((k) => `${k.id} ${k.name}`).join("\n") || "(none)",
    );
    return;
  }

  const tree = JSON.parse(readFileSync(treePath, "utf8"));
  // Clear any previous expansion
  for (const root of tree) {
    for (const g of root.groups || []) {
      for (const leaf of g.children || []) {
        delete leaf.children;
      }
    }
  }

  const stats = { fetched: 0, expanded: 0, leaves: 0, errors: 0, skippedLarge: 0 };
  const maxDepth = Number(process.argv.find((a) => a.startsWith("--depth="))?.slice(8) || 5);

  for (const root of tree) {
    console.log(`\n=== ${root.name} ===`);
    const rootParents = new Set([root.id]);
    for (const group of root.groups || []) {
      console.log(`# ${group.name}`);
      const groupParents = new Set(rootParents);
      groupParents.add(group.id);
      for (const leaf of group.children || []) {
        leaf.children = [];
        await expandNode(leaf, 2, maxDepth, stats, groupParents);
      }
    }
  }

  writeFileSync(treePath, JSON.stringify(tree, null, 2), "utf8");
  const flat = flatten(tree);
  writeFileSync(flatPath, JSON.stringify(flat, null, 2), "utf8");

  const byLevel = {};
  for (const c of flat) byLevel[c.level] = (byLevel[c.level] || 0) + 1;
  console.log("\nDone", stats);
  console.log("flat", flat.length, byLevel);

  const paper = flat.filter((c) => c.parentId === "1118");
  console.log(
    "Under 1118:",
    paper.map((c) => c.name).join(" | ") || "(none)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
