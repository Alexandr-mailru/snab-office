import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const base = "https://xn--80aqgg1a.xn--p1ai";
const prodDir = path.join(process.cwd(), "public", "products");
mkdirSync(prodDir, { recursive: true });

const plan = [
  { file: "p01.jpg", id: 547963, slug: "podstavka-deli-urbanroot-golubaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", featured: true, isNew: true, onSale: true },
  { file: "p02.jpg", id: 547964, slug: "podstavka-deli-urbanroot-zelenaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", featured: true, isNew: true, onSale: false },
  { file: "p03.jpg", id: 529624, slug: "pudra-cretacolor-grafit", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", featured: true, isNew: true, onSale: false },
  { file: "p04.jpg", id: 24413, slug: "bumaga-svetocopy-a4-500", brand: "SvetoCopy", brandSlug: "svetocopy", cat: "bumaga", featured: true, isNew: false, onSale: false },
  { file: "p05.jpg", id: 547975, slug: "podstavka-deli-urbanroot-yashiki-golubaya", brand: "Deli", brandSlug: "deli", cat: "organajzery", featured: true, isNew: true, onSale: true },
  { file: "p06.jpg", id: 502483, slug: "ruchka-bruno-uniwrite-kawaii", brand: "BrunoVisconti®", brandSlug: "bruno-visconti", cat: "ruchki", featured: false, isNew: true, onSale: false },
  { file: "p07.jpg", id: 397765, slug: "guash-nevskaya-palitra-cvetik", brand: "Невская палитра", brandSlug: "nevskaya-palitra", cat: "hudozhestvennye", featured: true, isNew: true, onSale: false },
  { file: "p08.jpg", id: 522202, slug: "bumaga-paperone-a4-500", brand: "PaperOne", brandSlug: "paperone", cat: "bumaga", featured: true, isNew: false, onSale: false },
  { file: "p09.jpg", id: 415202, slug: "krasitel-mixie-zheltyj", brand: "MIXIE", brandSlug: "mixie", cat: "konditeram", featured: true, isNew: true, onSale: false },
  { file: "p10.jpg", id: 511440, slug: "posypka-mr-flavor-palochki", brand: "Mr.FlavoR", brandSlug: "mr-flavor", cat: "konditeram", featured: false, isNew: false, onSale: true },
  { file: "p11.jpg", id: 111486, slug: "ruchka-attache-na-podstavke", brand: "Attache", brandSlug: "attache", cat: "ruchki", featured: false, isNew: false, onSale: false },
  { file: "p12.jpg", id: 26399, slug: "kartridzh-hp-06a", brand: "HP", brandSlug: "hp", cat: "tehnika", featured: false, isNew: false, onSale: true },
  { file: "p13.jpg", id: 26266, slug: "karandash-faber-castell-grip", brand: "Faber-Castell", brandSlug: "faber-castell", cat: "kancelyariya", featured: false, isNew: true, onSale: false },
  { file: "p14.jpg", id: 357701, slug: "girlyanda-zelenaya-cvetochki", brand: "deVENTE", brandSlug: "devente", cat: "prazdnik", featured: false, isNew: false, onSale: true },
  { file: "p15.jpg", id: 340659, slug: "papka-leitz-wow-zheltaya", brand: "Leitz", brandSlug: "leitz", cat: "ofis", featured: false, isNew: false, onSale: false },
  { file: "p16.jpg", id: 529627, slug: "pudra-cretacolor-ugolnaya", brand: "Cretacolor", brandSlug: "cretacolor", cat: "hudozhestvennye", featured: true, isNew: true, onSale: false },
];

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

async function parseDetail(id) {
  const res = await fetch(`${base}/catalog/detail/?ELEMENT_ID=${id}`);
  const html = await res.text();
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = nameMatch ? decodeHtml(nameMatch[1].replace(/<[^>]+>/g, "")) : null;

  const imgs = [...html.matchAll(/src="(\/upload\/iblock\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map((m) => m[1]);
  const unique = [...new Set(imgs)];
  const img = unique.find((u) => !/resize|nopic/i.test(u)) || unique.find((u) => /resize1/i.test(u)) || unique[0] || null;

  const priceMatch = html.match(/Цена:<\/span>\s*([\d\s]+)/);
  const price = priceMatch ? Number(priceMatch[1].replace(/\s/g, "")) : 0;

  const skuMatch = html.match(/Артикул:<\/span>\s*([^<\s]+)/);
  const sku = skuMatch ? skuMatch[1].trim() : `AMX-${id}`;

  let desc = "";
  const descMatch = html.match(/В корзину[\s\S]{0,220}<p>\s*(?:<br\s*\/?>\s*)*([\s\S]{40,900}?)<\/p>/i);
  if (descMatch) desc = decodeHtml(descMatch[1].replace(/<[^>]+>/g, " "));
  if (desc.length < 30) {
    const paras = [...html.matchAll(/<p>\s*(?:<br\s*\/?>\s*)*([^<]{50,500})/gi)]
      .map((m) => decodeHtml(m[1]))
      .filter((t) => !/cookie|Яндекс|политик/i.test(t));
    desc = paras[0] || name || "";
  }

  return { id, name, img, price, sku, desc };
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path.join(prodDir, file), buf);
  return buf.length;
}

async function main() {
  const products = [];
  for (const p of plan) {
    const d = await parseDetail(p.id);
    if (!d.name) {
      console.log("FAIL detail", p.id);
      continue;
    }
    if (d.img) {
      try {
        const size = await download(base + d.img, p.file);
        console.log(`IMG OK ${p.file} (${size}) <- ${d.img}`);
      } catch (e) {
        console.log(`IMG FAIL ${p.file}`, e);
      }
    } else {
      console.log("NO IMG", p.id);
    }

    const price = d.price || 0;
    products.push({
      slug: p.slug,
      sku: d.sku,
      name: d.name,
      description: d.desc || d.name,
      price,
      oldPrice: p.onSale && price ? Math.round(price * 1.12) : null,
      brandName: p.brand,
      brandSlug: p.brandSlug,
      categorySlug: p.cat,
      imageUrl: `/products/${p.file}`,
      externalId: `1c-${p.id}`,
      featured: p.featured,
      isNew: p.isNew,
      onSale: p.onSale,
      stock: 20 + (p.id % 80),
      sourceId: p.id,
    });
  }

  writeFileSync(
    path.join(process.cwd(), "prisma", "data", "products.json"),
    JSON.stringify(products, null, 2),
    "utf8",
  );
  console.log("PRODUCTS SAVED", products.length);
  for (const x of products) console.log(`${x.slug} | ${x.price} | ${x.imageUrl} | ${x.name}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
