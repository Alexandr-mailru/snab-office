const fs = require("fs");
const html = fs.readFileSync("fixtures/src-detail-urbanroot.html", "utf8");

const TOP_NAMES = {
  833: "Товары для офиса",
  1175: "Товары для детей",
  1158: "Все для творчества",
  1151: "Бизнес-подарки",
  1149: "Все для праздника",
  1231: "Активный отдых",
  14105: "Товары для кондитеров",
};

const MENU_SHORT = {
  833: "Офис",
  1175: "Для детей",
  1158: "Творчество",
  1151: "Подарки",
  1149: "Все для праздника",
  1231: "Активный отдых",
  14105: "Для кондитеров",
};

const topRe =
  /<li class="dropdown dropdown-large"><a href="\/catalog\/\?SECTION_ID=(\d+)"[^>]*>([^<]+)<\/a><div class="dropdown-menu dropdown-menu-large">([\s\S]*?)<\/div><\/li>/g;

function slugify(name, id) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  const base = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
  return `${base || "sec"}-${id}`;
}

const tree = [];
let top;
while ((top = topRe.exec(html))) {
  const id = top[1];
  const section = {
    id,
    name: TOP_NAMES[id] || top[2].trim(),
    menuName: MENU_SHORT[id] || top[2].trim(),
    slug: slugify(TOP_NAMES[id] || top[2].trim(), id),
    groups: [],
  };
  const body = top[3];
  const tokens = [
    ...body.matchAll(
      /<li(?: class="header")?><a href="\/catalog\/\?SECTION_ID=(\d+)"[^>]*>([^<]+)<\/a><\/li>/g,
    ),
  ];
  let current = null;
  for (const t of tokens) {
    const full = t[0];
    const cid = t[1];
    const name = t[2].trim();
    if (full.includes('class="header"')) {
      current = {
        id: cid,
        name,
        slug: slugify(name, cid),
        children: [],
      };
      section.groups.push(current);
    } else if (current) {
      current.children.push({
        id: cid,
        name,
        slug: slugify(name, cid),
      });
    } else {
      section.groups.push({
        id: cid,
        name,
        slug: slugify(name, cid),
        children: [],
      });
    }
  }
  tree.push(section);
}

fs.writeFileSync(
  "prisma/data/snaboffice-category-tree.json",
  JSON.stringify(tree, null, 2),
  "utf8",
);

const flat = [];
for (const root of tree) {
  flat.push({ id: root.id, slug: root.slug, name: root.name, level: 0 });
  for (const g of root.groups) {
    flat.push({ id: g.id, slug: g.slug, name: g.name, level: 1, parentId: root.id });
    for (const c of g.children) {
      flat.push({ id: c.id, slug: c.slug, name: c.name, level: 2, parentId: g.id });
    }
  }
}
fs.writeFileSync(
  "prisma/data/snaboffice-category-flat.json",
  JSON.stringify(flat, null, 2),
  "utf8",
);
console.log(tree.map((s) => `${s.slug} :: ${s.name} (${s.groups.length})`).join("\n"));
console.log("flat", flat.length);
