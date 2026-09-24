import { prisma } from "@/lib/prisma";
import { resolveCategorySlug } from "@/lib/categoryAliases";
import type { Prisma } from "@prisma/client";

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name" | "newest";
export type CatalogView = "grid" | "list";

export const PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;
export const DEFAULT_PER_PAGE = 24;

export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number];

/** Next larger page size after "Показать ещё" (12→24→48→96). */
export function nextPerPageOption(current: number): PerPageOption | null {
  const idx = PER_PAGE_OPTIONS.findIndex((n) => n === current);
  if (idx >= 0) return PER_PAGE_OPTIONS[idx + 1] ?? null;
  const next = PER_PAGE_OPTIONS.find((n) => n > current);
  return next ?? null;
}

export type ProductSearchOpts = {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  brandSlugs?: string[];
  filter?: "new" | "sale" | "all";
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  colors?: string[];
  formats?: string[];
  storeSlug?: string;
  page?: number;
  perPage?: number;
  sort?: ProductSort;
};

const catalogProductInclude = {
  category: true,
  brand: true,
  storeStocks: { include: { store: { select: { slug: true, name: true } } } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }>;

export type ProductSearchResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  perPage: number;
};

const SEARCH_STOPWORDS = new Set([
  "и",
  "в",
  "во",
  "на",
  "по",
  "с",
  "со",
  "к",
  "ко",
  "для",
  "из",
  "от",
  "до",
  "под",
  "при",
  "или",
  "а",
  "о",
  "об",
]);

const RU_TO_EN_KEYBOARD: Record<string, string> = {
  й: "q",
  ц: "w",
  у: "e",
  к: "r",
  е: "t",
  н: "y",
  г: "u",
  ш: "i",
  щ: "o",
  з: "p",
  х: "[",
  ъ: "]",
  ф: "a",
  ы: "s",
  в: "d",
  а: "f",
  п: "g",
  р: "h",
  о: "j",
  л: "k",
  д: "l",
  ж: ";",
  э: "'",
  я: "z",
  ч: "x",
  с: "c",
  м: "v",
  и: "b",
  т: "n",
  ь: "m",
  б: ",",
  ю: ".",
};

const EN_TO_RU_KEYBOARD: Record<string, string> = Object.fromEntries(
  Object.entries(RU_TO_EN_KEYBOARD).map(([ru, en]) => [en, ru]),
) as Record<string, string>;

function splitQuery(input: string | undefined) {
  const normalized = (input || "").trim().toLowerCase();
  if (!normalized) return [];
  const parts = normalized
    .split(/[\s,.;:/\\|()[\]{}"'`!?+-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const filtered = parts.filter((t) => !SEARCH_STOPWORDS.has(t));
  // If query is a single short service-like word (e.g. "под"),
  // keep it to avoid turning a real user query into "show all".
  if (!filtered.length && parts.length === 1) return parts;
  return filtered;
}

function normalizeWord(word: string) {
  let w = word.toLowerCase().replace(/ё/g, "е");
  if (w.length <= 4) return w;
  const endings = [
    "иями",
    "ями",
    "ами",
    "ями",
    "ого",
    "ему",
    "ому",
    "его",
    "ыми",
    "ими",
    "ий",
    "ый",
    "ой",
    "ая",
    "яя",
    "ое",
    "ее",
    "ам",
    "ям",
    "ах",
    "ях",
    "ов",
    "ев",
    "ом",
    "ем",
    "ую",
    "юю",
    "а",
    "я",
    "ы",
    "и",
    "е",
    "у",
    "ю",
  ];
  for (const end of endings) {
    if (w.endsWith(end) && w.length - end.length >= 3) {
      w = w.slice(0, -end.length);
      break;
    }
  }
  return w;
}

function convertKeyboardLayout(text: string, map: Record<string, string>) {
  return text
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

function buildTokenSet(input: string | undefined) {
  const base = splitQuery(input).map(normalizeWord);
  if (base.length) return Array.from(new Set(base));
  const query = (input || "").trim().toLowerCase();
  if (!query) return [];
  const altRu = splitQuery(convertKeyboardLayout(query, EN_TO_RU_KEYBOARD)).map(normalizeWord);
  const altEn = splitQuery(convertKeyboardLayout(query, RU_TO_EN_KEYBOARD)).map(normalizeWord);
  if (altRu.length) return Array.from(new Set(altRu));
  if (altEn.length) return Array.from(new Set(altEn));
  return [];
}

function tokenizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[\s,.;:/\\|()[\]{}"'`!?+-]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .map(normalizeWord);
}

function tokenMatchesWord(word: string, token: string) {
  // Short tokens are noisy with substring matching ("под" in random words).
  if (token.length <= 3) return word.startsWith(token);
  // Prefix match only: «маркер» → маркер/маркерная, but NOT пейнтмаркер.
  return word === token || word.startsWith(token);
}

function countTokenMatches(
  text: string,
  tokens: string[],
): { matched: number; startsWithFirst: boolean } {
  const words = tokenizeText(text);
  let matched = 0;
  for (const t of tokens) {
    if (words.some((w) => tokenMatchesWord(w, t))) matched += 1;
  }
  return {
    matched,
    startsWithFirst: tokens[0] ? words.some((w) => w.startsWith(tokens[0])) : false,
  };
}

function rankTokenMatches(primary: string, secondary: string, tokens: string[]) {
  const inPrimary = countTokenMatches(primary, tokens);
  // Descriptions only help longer queries; short prefixes must stay title-focused.
  const useSecondary = tokens.some((t) => t.length > 3);
  const inSecondary = useSecondary
    ? countTokenMatches(secondary, tokens)
    : { matched: 0, startsWithFirst: false };
  return {
    matchedPrimary: inPrimary.matched,
    matchedAny: Math.max(inPrimary.matched, inSecondary.matched),
    startsWithFirst: inPrimary.startsWithFirst,
  };
}

function firstProductWord(name: string) {
  return tokenizeText(name)[0] || "";
}

/** Soft intent heuristics for common office-catalog queries. */
function searchIntentBonus(haystack: string, tokens: string[], productName: string) {
  const text = haystack.toLowerCase().replace(/ё/g, "е");
  const name = productName.toLowerCase().replace(/ё/g, "е");
  const head = firstProductWord(productName);
  let bonus = 0;

  const wantsPrinter = tokens.some((t) => t.startsWith("принт"));
  const wantsPaper = tokens.some((t) => t.startsWith("бумаг"));
  const wantsMarker = tokens.some((t) => t.startsWith("маркер"));
  const wantsBoard = tokens.some((t) => t.startsWith("доск"));
  const wantsColor = tokens.some((t) =>
    /^(голуб|син|зелен|красн|желт|розов|оранж|фиолет|бел|черн|сер)/.test(t),
  );

  if (wantsPaper && wantsPrinter) {
    if (/протироч|туалет|полотен|салфет|влажн|кухон/.test(text)) bonus -= 120;
    if (/магнитн/.test(text)) bonus -= 35;
    if (/офисн|лазерн|струйн|принтер|ксерокс|копир|для печати/.test(text)) bonus += 55;
    if (/\ba4\b|а4|svetocopy|paperone|снегуроч|iq color|для офисной техники/.test(text)) {
      bonus += 35;
    }
  }

  // «Маркеры для (белой) доски» → маркеры для доски, не пейнтмаркер и не сами доски.
  if (wantsMarker && wantsBoard) {
    if (/пейнт|paint\s*marker|лаков(ый|ые)\s+маркер|промышленн/.test(text)) bonus -= 140;
    if (/^доска\b|магнитно-?маркерн/.test(name) && !/^маркер\b/.test(name)) bonus -= 100;
    if (/^маркер\b/.test(name) && /для доск|whiteboard|white\s*board/.test(text)) bonus += 90;
    if (/^маркер\b/.test(name)) bonus += 55;
    if (head.startsWith("маркер")) bonus += 40;
    if (head.startsWith("доск")) bonus -= 70;
  } else if (wantsMarker && tokens[0]?.startsWith("маркер")) {
    if (/пейнт|paint\s*marker/.test(text)) bonus -= 80;
    if (head.startsWith("маркер")) bonus += 45;
    if (head.startsWith("доск")) bonus -= 50;
  }

  if (wantsColor) {
    const colorTok = tokens.find((t) =>
      /^(голуб|син|зелен|красн|желт|розов|оранж|фиолет|бел|черн|сер)/.test(t),
    );
    // «белой доски» — цвет относится к доске, не к корпусу маркера/товара.
    if (colorTok && wantsBoard && wantsMarker) {
      if (/бел(ой|ая|ый)?\s+доск|для белой доски|whiteboard/.test(text)) bonus += 25;
      else if (colorTok.startsWith("бел") && /корпус\s+бел|бел(ый|ая)\s+корпус/.test(text)) {
        bonus -= 25;
      }
    } else if (colorTok && text.includes(colorTok)) {
      bonus += 20;
    }
  }

  return bonus;
}

function scoreSearchHit(opts: {
  matchedPrimary: number;
  matchedAny: number;
  startsWithFirst: boolean;
  featured: boolean;
  tokenCount: number;
  haystack: string;
  tokens: string[];
  productName: string;
}) {
  const {
    matchedPrimary,
    matchedAny,
    startsWithFirst,
    featured,
    tokenCount,
    haystack,
    tokens,
    productName,
  } = opts;
  const allPrimary = matchedPrimary >= tokenCount ? 1 : 0;
  return (
    matchedPrimary * 100 +
    allPrimary * 90 +
    matchedAny * 8 +
    (startsWithFirst ? 18 : 0) +
    (featured ? 4 : 0) +
    searchIntentBonus(haystack, tokens, productName)
  );
}

function textSearchOrFilters(tokens: string[]) {
  return tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" as const } },
    { brandName: { contains: token, mode: "insensitive" as const } },
    { sku: { contains: token, mode: "insensitive" as const } },
    { description: { contains: token, mode: "insensitive" as const } },
  ]);
}

function rankSearchCandidates(
  candidates: CatalogProduct[],
  tokens: string[],
  strictShortQuery: boolean,
) {
  const minTokensToMatch =
    tokens.length >= 3 ? Math.max(2, tokens.length - 1) : tokens.length > 1 ? tokens.length - 1 : 1;

  const scored = candidates
    .map((p) => {
      const primary = `${p.name} ${p.sku ?? ""} ${p.brandName ?? ""} ${p.variantLabel ?? ""}`.toLowerCase();
      const secondary = `${p.description ?? ""}`.toLowerCase();
      const ranked = rankTokenMatches(primary, secondary, tokens);
      const haystack = `${primary} ${secondary}`;
      const score = scoreSearchHit({
        ...ranked,
        featured: p.featured,
        tokenCount: tokens.length,
        haystack,
        tokens,
        productName: p.name,
      });
      return { p, ...ranked, score, haystack };
    })
    .filter((x) => {
      if (strictShortQuery) return x.startsWithFirst;
      if (!(x.matchedPrimary >= minTokensToMatch || x.matchedAny >= minTokensToMatch)) {
        return false;
      }
      const wantsPrinter = tokens.some((t) => t.startsWith("принт"));
      const wantsPaper = tokens.some((t) => t.startsWith("бумаг"));
      if (wantsPrinter && wantsPaper && /протироч|туалет|полотен|салфет|влажн/.test(x.haystack)) {
        return false;
      }
      const wantsMarker = tokens.some((t) => t.startsWith("маркер"));
      const wantsBoard = tokens.some((t) => t.startsWith("доск"));
      if (wantsMarker && wantsBoard) {
        if (/пейнтмаркер|paint\s*marker/.test(x.haystack)) return false;
        // Query is for markers, not the boards themselves.
        if (firstProductWord(x.p.name).startsWith("доск")) return false;
      }
      return true;
    });

  // Prefer full-title matches; keep near-misses only if they still score well.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedPrimary !== a.matchedPrimary) return b.matchedPrimary - a.matchedPrimary;
    return a.p.name.localeCompare(b.p.name, "ru");
  });

  const best = scored[0]?.score ?? 0;
  const filtered =
    tokens.length >= 3
      ? scored.filter(
          (x) =>
            x.matchedPrimary >= tokens.length ||
            x.score >= best - 50 ||
            x.matchedPrimary >= tokens.length - 1,
        )
      : scored;

  return filtered.map((x) => x.p);
}

export async function searchProducts(opts: ProductSearchOpts): Promise<ProductSearchResult> {
  const {
    q,
    page: pageRaw = 1,
    perPage: perPageRaw = DEFAULT_PER_PAGE,
    sort = "featured",
  } = opts;

  const page = pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const perPage = PER_PAGE_OPTIONS.includes(perPageRaw as (typeof PER_PAGE_OPTIONS)[number])
    ? perPageRaw
    : DEFAULT_PER_PAGE;
  const skip = (page - 1) * perPage;

  const baseWhere = await buildProductWhere(opts);
  const tokens = buildTokenSet(q);
  const strictShortQuery = tokens.length === 1 && tokens[0].length <= 3;
  const include = catalogProductInclude;

  if (!tokens.length) {
    const [total, items] = await Promise.all([
      prisma.product.count({ where: baseWhere }),
      prisma.product.findMany({
        where: baseWhere,
        include,
        orderBy: getOrderBy(sort),
        skip,
        take: perPage,
      }),
    ]);
    return { items, total, page, perPage };
  }

  // Pull candidates that actually mention query tokens — not a random featured slice.
  const where: Prisma.ProductWhereInput = {
    AND: [baseWhere, { OR: textSearchOrFilters(tokens) }],
  };

  const candidates = await prisma.product.findMany({
    where,
    include,
    orderBy: getOrderBy(sort),
    take: Math.max(perPage * 20, 600),
  });

  const ranked = rankSearchCandidates(candidates, tokens, strictShortQuery);
  const total = ranked.length;
  const items = ranked.slice(skip, skip + perPage);

  return { items, total, page, perPage };
}

async function buildProductWhere(opts: ProductSearchOpts) {
  const {
    categorySlug,
    brandSlug,
    brandSlugs,
    filter = "all",
    minPrice,
    maxPrice,
    inStock,
    colors,
    formats,
    storeSlug,
  } = opts;

  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const slug = resolveCategorySlug(categorySlug);
    const all = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
    });
    const target = all.find((c) => c.slug === slug);
    if (target) {
      const childrenOf = new Map<string | null, string[]>();
      for (const c of all) {
        const key = c.parentId;
        if (!childrenOf.has(key)) childrenOf.set(key, []);
        childrenOf.get(key)!.push(c.id);
      }
      const ids: string[] = [];
      const stack = [target.id];
      while (stack.length) {
        const id = stack.pop()!;
        ids.push(id);
        for (const childId of childrenOf.get(id) ?? []) stack.push(childId);
      }
      categoryIds = ids;
    }
  }

  const brands = [...(brandSlugs ?? []), ...(brandSlug ? [brandSlug] : [])].filter(Boolean);

  return {
    active: true,
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(brands.length === 1 ? { brand: { slug: brands[0] } } : {}),
    ...(brands.length > 1 ? { brand: { slug: { in: brands } } } : {}),
    ...(filter === "new" ? { isNew: true } : {}),
    ...(filter === "sale" ? { onSale: true } : {}),
    ...(typeof minPrice === "number" ? { price: { gte: minPrice } } : {}),
    ...(typeof maxPrice === "number"
      ? { price: { ...(typeof minPrice === "number" ? { gte: minPrice } : {}), lte: maxPrice } }
      : {}),
    ...(colors?.length ? { color: { in: colors } } : {}),
    ...(formats?.length ? { format: { in: formats } } : {}),
    ...(inStock && storeSlug
      ? { storeStocks: { some: { store: { slug: storeSlug }, stock: { gt: 0 } } } }
      : {}),
    ...(inStock && !storeSlug ? { stock: { gt: 0 } } : {}),
  } satisfies Prisma.ProductWhereInput;
}

function getOrderBy(sort: ProductSort = "featured"): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "name":
      return [{ name: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ featured: "desc" }, { name: "asc" }];
  }
}

export async function suggestSearch(q: string, take = 10) {
  const tokens = buildTokenSet(q);
  if (!tokens.length) {
    return { products: [], brands: [], categories: [] };
  }
  const strictShortQuery = tokens.length === 1 && tokens[0].length <= 3;

  const productOr = tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" as const } },
    { brandName: { contains: token, mode: "insensitive" as const } },
    { sku: { contains: token, mode: "insensitive" as const } },
  ]);

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, OR: productOr },
      select: {
        slug: true,
        name: true,
        brandName: true,
        imageUrl: true,
        price: true,
        featured: true,
        sku: true,
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: Math.max(take * 12, 80),
    }),
    prisma.brand.findMany({
      where: {
        OR: tokens.map((token) => ({
          name: { contains: token, mode: "insensitive" as const },
        })),
      },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 40,
    }),
    prisma.category.findMany({
      where: {
        OR: tokens.map((token) => ({
          name: { contains: token, mode: "insensitive" as const },
        })),
      },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 60,
    }),
  ]);

  const minTokensToMatch = tokens.length > 1 ? tokens.length - 1 : 1;
  const rankedProducts = products
    .map((p) => {
      const haystack = `${p.name} ${p.brandName ?? ""} ${p.sku ?? ""}`;
      const { matched, startsWithFirst } = countTokenMatches(haystack, tokens);
      const score = scoreSearchHit({
        matchedPrimary: matched,
        matchedAny: matched,
        startsWithFirst,
        featured: p.featured,
        tokenCount: tokens.length,
        haystack,
        tokens,
        productName: p.name,
      });
      return { p, matched, startsWithFirst, score, haystack };
    })
    .filter((x) => x.matched >= minTokensToMatch)
    .filter((x) => (strictShortQuery ? x.startsWithFirst : true))
    .filter((x) => {
      const wantsPrinter = tokens.some((t) => t.startsWith("принт"));
      const wantsPaper = tokens.some((t) => t.startsWith("бумаг"));
      if (wantsPrinter && wantsPaper && /протироч|туалет|полотен|салфет|влажн/.test(x.haystack)) {
        return false;
      }
      const wantsMarker = tokens.some((t) => t.startsWith("маркер"));
      const wantsBoard = tokens.some((t) => t.startsWith("доск"));
      if (wantsMarker && wantsBoard) {
        if (/пейнтмаркер|paint\s*marker/.test(x.haystack)) return false;
        if (firstProductWord(x.p.name).startsWith("доск")) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.matched !== a.matched) return b.matched - a.matched;
      return a.p.name.localeCompare(b.p.name, "ru");
    })
    .slice(0, take)
    .map((x) => ({
      slug: x.p.slug,
      name: x.p.name,
      brandName: x.p.brandName,
      imageUrl: x.p.imageUrl,
      price: x.p.price,
    }));

  const rankedBrands = brands
    .map((b) => {
      const { matched, startsWithFirst } = countTokenMatches(b.name, tokens);
      return { b, matched, startsWithFirst };
    })
    .filter((x) => x.matched >= 1)
    .sort((a, b) => {
      if (b.matched !== a.matched) return b.matched - a.matched;
      if (a.startsWithFirst !== b.startsWithFirst) return a.startsWithFirst ? -1 : 1;
      return a.b.name.localeCompare(b.b.name, "ru");
    })
    .slice(0, 6)
    .map((x) => x.b);

  const rankedCategories = categories
    .map((c) => {
      const { matched, startsWithFirst } = countTokenMatches(c.name, tokens);
      return { c, matched, startsWithFirst };
    })
    .filter((x) => x.matched >= 1)
    .sort((a, b) => {
      if (b.matched !== a.matched) return b.matched - a.matched;
      if (a.startsWithFirst !== b.startsWithFirst) return a.startsWithFirst ? -1 : 1;
      return a.c.name.localeCompare(b.c.name, "ru");
    })
    .slice(0, 8)
    .map((x) => x.c);

  return { products: rankedProducts, brands: rankedBrands, categories: rankedCategories };
}

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const filterRaw = one("filter");
  const filter: "new" | "sale" | "all" =
    filterRaw === "new" || filterRaw === "sale" ? filterRaw : "all";

  const brand = one("brand") || undefined;
  const brandsFromList = (one("brands") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const brands = Array.from(new Set([...brandsFromList, ...(brand ? [brand] : [])]));

  const colors = (one("colors") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const formats = (one("formats") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const storeSlug = one("store") || undefined;

  const minPrice = Number(one("minPrice"));
  const maxPrice = Number(one("maxPrice"));
  const inStock = one("inStock") === "1" || one("inStock") === "true";

  const pageRaw = Number(one("page"));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const perPageRaw = Number(one("perPage"));
  const perPage = PER_PAGE_OPTIONS.includes(perPageRaw as (typeof PER_PAGE_OPTIONS)[number])
    ? perPageRaw
    : DEFAULT_PER_PAGE;

  const sortRaw = one("sort");
  const sort: ProductSort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "name" ||
    sortRaw === "newest"
      ? sortRaw
      : "featured";

  const viewRaw = one("view");
  const view: CatalogView = viewRaw === "list" ? "list" : "grid";

  return {
    q: one("q")?.trim() || undefined,
    filter,
    brandSlug: brands.length === 1 ? brands[0] : undefined,
    brandSlugs: brands.length > 1 ? brands : brands.length === 1 ? brands : undefined,
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    inStock: inStock || undefined,
    colors: colors.length ? colors : undefined,
    formats: formats.length ? formats : undefined,
    storeSlug,
    page,
    perPage,
    sort,
    view,
  };
}

export type FacetValue = { value: string; count: number };
export type FacetBrand = { slug: string; name: string; count: number };

export async function getCatalogFacets(opts: ProductSearchOpts) {
  const whereBase = await buildProductWhere({
    ...opts,
    brandSlug: undefined,
    brandSlugs: undefined,
    colors: undefined,
    formats: undefined,
  });
  const whereForColors = await buildProductWhere({ ...opts, colors: undefined });
  const whereForFormats = await buildProductWhere({ ...opts, formats: undefined });

  const [brandGroups, colorGroups, formatGroups, brandRows] = await Promise.all([
    prisma.product.groupBy({
      by: ["brandId"],
      where: { ...whereBase, brandId: { not: null } },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["color"],
      where: { ...whereForColors, color: { not: null } },
      _count: { _all: true },
      orderBy: { color: "asc" },
      take: 40,
    }),
    prisma.product.groupBy({
      by: ["format"],
      where: { ...whereForFormats, format: { not: null } },
      _count: { _all: true },
      orderBy: { format: "asc" },
      take: 40,
    }),
    prisma.brand.findMany({
      where: { products: { some: { active: true } } },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
      take: 80,
    }),
  ]);

  const countByBrandId = new Map(brandGroups.map((g) => [g.brandId, g._count._all]));
  const brands: FacetBrand[] = brandRows
    .map((b) => ({ slug: b.slug, name: b.name, count: countByBrandId.get(b.id) ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const colors: FacetValue[] = colorGroups
    .filter((g): g is typeof g & { color: string } => !!g.color)
    .map((g) => ({ value: g.color, count: g._count._all }));

  const formats: FacetValue[] = formatGroups
    .filter((g): g is typeof g & { format: string } => !!g.format)
    .map((g) => ({ value: g.format, count: g._count._all }));

  return { brands, colors, formats };
}

export async function getCatalogPriceBounds(opts: ProductSearchOpts) {
  const where = await buildProductWhere({
    ...opts,
    minPrice: undefined,
    maxPrice: undefined,
  });
  const agg = await prisma.product.aggregate({
    where,
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: agg._min.price ?? 0,
    max: agg._max.price ?? 10000,
  };
}

export function getStoreStock(
  product: {
    stock: number;
    storeStocks?: { stock: number; store: { slug: string; name: string } }[];
  },
  storeSlug?: string,
) {
  if (!storeSlug) return product.stock;
  const row = product.storeStocks?.find((s) => s.store.slug === storeSlug);
  return row?.stock ?? 0;
}

export function buildCatalogQueryString(
  sp: Record<string, string | string[] | undefined>,
  extras?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
  }
  return params.toString();
}

export function parseListingView(sp: Record<string, string | string[] | undefined>): CatalogView {
  const v = sp.view;
  const raw = Array.isArray(v) ? v[0] : v;
  return raw === "list" ? "list" : "grid";
}
