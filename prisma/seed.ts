import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

type BrandRow = { slug: string; name: string };

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.productStoreStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.store.deleteMany();
  await prisma.news.deleteMany();
  await prisma.document.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.user.deleteMany();

  const brandsData = JSON.parse(
    readFileSync(path.join(__dirname, "data", "brands.json"), "utf8"),
  ) as BrandRow[];

  // Ensure product brands exist even if missing from scraped list
  const ensure = [
    { slug: "deli", name: "Deli" },
    { slug: "cretacolor", name: "Cretacolor" },
    { slug: "faber-castell", name: "Faber-Castell" },
    { slug: "maped", name: "Maped" },
    { slug: "attache", name: "Attache" },
    { slug: "leitz", name: "Leitz" },
    { slug: "bruno-visconti", name: "BrunoVisconti®" },
    { slug: "nevskaya-palitra", name: "Невская палитра" },
    { slug: "cakedecor", name: "CakeDecor" },
    { slug: "snegurochka", name: "Снегурочка" },
    { slug: "svetocopy", name: "SvetoCopy" },
    { slug: "paperone", name: "PaperOne" },
    { slug: "mixie", name: "MIXIE" },
    { slug: "mr-flavor", name: "Mr.FlavoR" },
    { slug: "hp", name: "HP" },
    { slug: "devente", name: "deVENTE" },
  ];
  const bySlug = new Map(brandsData.map((b) => [b.slug, b]));
  for (const row of ensure) {
    if (!bySlug.has(row.slug)) brandsData.push(row);
  }

  await prisma.brand.createMany({
    data: brandsData.map((b, i) => ({
      slug: b.slug,
      name: b.name,
      sortOrder: i + 1,
    })),
  });

  const brands = await prisma.brand.findMany();
  const brand = Object.fromEntries(brands.map((b) => [b.slug, b]));

  type SnabOfficeNode = {
    id: string;
    name: string;
    slug: string;
    children?: SnabOfficeNode[];
  };
  type SnabOfficeGroup = {
    id: string;
    name: string;
    slug: string;
    children: SnabOfficeNode[];
  };
  type SnabOfficeRoot = {
    id: string;
    name: string;
    menuName?: string;
    slug: string;
    groups: SnabOfficeGroup[];
  };

  const snabofficeTree = JSON.parse(
    readFileSync(path.join(__dirname, "data", "shop-category-tree.json"), "utf8"),
  ) as SnabOfficeRoot[];

  const categoryBySlug: Record<string, string> = {};

  async function createCategoryTree(
    nodes: SnabOfficeNode[],
    parentId: string,
    orderBase = 0,
  ) {
    for (const [i, node] of nodes.entries()) {
      const cat = await prisma.category.create({
        data: {
          slug: node.slug,
          name: node.name,
          description: node.name,
          externalId: node.id,
          parentId,
          sortOrder: orderBase + i + 1,
        },
      });
      categoryBySlug[node.slug] = cat.id;
      if (node.children?.length) {
        await createCategoryTree(node.children, cat.id);
      }
    }
  }

  for (const [rootOrder, root] of snabofficeTree.entries()) {
    const rootCat = await prisma.category.create({
      data: {
        slug: root.slug,
        name: root.menuName || root.name,
        description: root.name,
        externalId: root.id,
        sortOrder: rootOrder + 1,
        imageHint:
          root.id === "833"
            ? "office"
            : root.id === "1175"
              ? "school"
              : root.id === "1158"
                ? "art"
                : root.id === "14105"
                  ? "sweet"
                  : root.id === "1149"
                    ? "sweet"
                    : root.id === "1231"
                      ? "outdoor"
                      : "office",
      },
    });
    categoryBySlug[root.slug] = rootCat.id;

    for (const [groupOrder, group] of root.groups.entries()) {
      const midCat = await prisma.category.create({
        data: {
          slug: group.slug,
          name: group.name,
          description: group.name,
          externalId: group.id,
          parentId: rootCat.id,
          sortOrder: groupOrder + 1,
        },
      });
      categoryBySlug[group.slug] = midCat.id;
      if (group.children?.length) {
        await createCategoryTree(group.children, midCat.id);
      }
    }
  }

  type ProductSeed = {
    slug: string;
    sku: string;
    name: string;
    description: string;
    price: number;
    oldPrice: number | null;
    brandName: string;
    brandSlug: string;
    categorySlug: string;
    imageUrl: string;
    images?: string[];
    variantGroup?: string | null;
    variantLabel?: string | null;
    externalId: string;
    featured: boolean;
    isNew: boolean;
    onSale: boolean;
    stock: number;
  };

  function inferFormat(name: string, description: string) {
    const text = `${name} ${description}`;
    const match = text.match(/\b(A[0-5]|B[0-5]|DL|C[0-5])\b/i);
    return match ? match[1].toUpperCase() : undefined;
  }

  function inferColor(name: string, variantLabel?: string | null) {
    if (variantLabel) return variantLabel;
    const lower = name.toLowerCase();
    const map: [string, string][] = [
      ["голуб", "Голубой"],
      ["син", "Синий"],
      ["зелен", "Зелёный"],
      ["красн", "Красный"],
      ["черн", "Чёрный"],
      ["бел", "Белый"],
      ["желт", "Жёлтый"],
      ["розов", "Розовый"],
      ["сер", "Серый"],
      ["графит", "Графит"],
      ["оранж", "Оранжевый"],
    ];
    for (const [needle, label] of map) {
      if (lower.includes(needle)) return label;
    }
    return undefined;
  }

  const productRows = JSON.parse(
    readFileSync(path.join(__dirname, "data", "products.json"), "utf8"),
  ) as ProductSeed[];

  for (const row of productRows) {
    const brandRow = brand[row.brandSlug];
    const categoryId = categoryBySlug[row.categorySlug];
    if (!categoryId) {
      throw new Error(`Unknown categorySlug: ${row.categorySlug}`);
    }
    const images = row.images?.length ? row.images : row.imageUrl ? [row.imageUrl] : [];
    await prisma.product.create({
      data: {
        slug: row.slug,
        sku: row.sku,
        name: row.name,
        description: row.description,
        price: row.price,
        oldPrice: row.oldPrice ?? undefined,
        stock: row.stock,
        brandName: row.brandName,
        brandId: brandRow?.id,
        imageUrl: images[0] ?? row.imageUrl,
        images: JSON.stringify(images),
        variantGroup: row.variantGroup ?? undefined,
        variantLabel: row.variantLabel ?? undefined,
        color: inferColor(row.name, row.variantLabel),
        format: inferFormat(row.name, row.description),
        featured: row.featured,
        isNew: row.isNew,
        onSale: row.onSale,
        categoryId,
        externalId: row.externalId,
      },
    });
  }

  await prisma.banner.createMany({
    data: [
      {
        title: "Школьный базар",
        subtitle: "Тетради, рюкзаки и канцелярия к учебному году",
        href: "/catalog?filter=new",
        tone: "yellow",
        sortOrder: 1,
      },
      {
        title: "Товары для кондитеров",
        subtitle: "Красители, посыпки, декор и инвентарь",
        href: "/catalog/konditeram",
        tone: "red",
        sortOrder: 2,
      },
      {
        title: "Для организаций",
        subtitle: "Договор, список цен и менеджер для вашего офиса",
        href: "/corporate",
        tone: "dark",
        sortOrder: 3,
      },
      {
        title: "Распродажа недели",
        subtitle: "Скидки на органайзеры, бумагу и технику",
        href: "/catalog?filter=sale",
        tone: "sale",
        sortOrder: 4,
      },
    ],
  });

  await prisma.store.createMany({
    data: [
      {
        slug: "kommunisticheskij",
        name: "«СнабОфис» на Коммунистическом проспекте",
        address: "г. Москва, Коммунистический пр., 49",
        phones: "(4242) 22-36-36",
        hours: "с 09:00 до 18:00 · суббота и воскресенье с 10:00 до 16:00",
        corporatePhones: "(4242) 22-19-22 (многоканальный)",
        corporateHours: "Пн-Чт с 09:00 до 18:00, Пт с 09:00 до 17:00, Сб и Вс выходной",
        description:
          "Цокольный этаж: лучший выбор канцелярских товаров, офисного оборудования и расходных материалов. Первый этаж: художественные материалы, товары для школы и детского творчества.",
        // Координаты с snaboffice.demo (Bitrix map placemarks)
        mapEmbedUrl:
          "https://yandex.ru/map-widget/v1/?ll=142.73111739021%2C46.958095654238&z=17&pt=142.73111739021,46.958095654238,pm2rdm",
        sortOrder: 1,
      },
      {
        slug: "purkaeva",
        name: "Супермаркет «СнабОфис» на улице Пуркаева",
        address: "г. Москва, ул. Пуркаева, 110",
        phones: "(4242) 23-71-71, (4242) 22-56-56",
        hours: "Ежедневно c 10:00 до 19:00",
        corporatePhones: "(4242) 23-76-73",
        corporateHours: "Пн-Чт с 09:00 до 18:00, Пт с 09:00 до 17:00, Сб и Вс выходной",
        description:
          "Первый супермаркет канцелярских товаров в Москве. Цокольный этаж: художественные материалы. Первый этаж: товары для школы и детского творчества, отдел товаров для кондитеров и праздничного оформления. Второй этаж: большой ассортимент товаров для офиса, офисной техники, бизнес-подарки в салоне «Oxford-II».",
        mapEmbedUrl:
          "https://yandex.ru/map-widget/v1/?ll=142.73627594373%2C46.934683503974&z=17&pt=142.73627594373,46.934683503974,pm2rdm",
        sortOrder: 2,
      },
    ],
  });

  const stores = await prisma.store.findMany({ orderBy: { sortOrder: "asc" } });
  const products = await prisma.product.findMany({ select: { id: true, stock: true } });
  for (const product of products) {
    if (!stores.length) break;
    const main = Math.max(0, Math.round(product.stock * 0.6));
    const secondary = Math.max(0, product.stock - main);
    await prisma.productStoreStock.createMany({
      data: [
        { productId: product.id, storeId: stores[0].id, stock: main },
        ...(stores[1] ? [{ productId: product.id, storeId: stores[1].id, stock: secondary }] : []),
      ],
    });
  }

  await prisma.news.createMany({
    data: [
      {
        slug: "maped-colorpeps-infinity",
        title: "Maped Color’Peps Infinity",
        excerpt:
          "Необычные цветные карандаши без деревянного корпуса: цельный цветной стержень, длительный срок службы, удобная треугольная форма и минимум заточки.",
        body: "Color’Peps Infinity – линейка необычных цветных карандашей от Maped, в которой привычный деревянный корпус заменен цельным цветным стержнем. Благодаря такой конструкции карандаш используется практически полностью и не требует регулярной заточки. Главная особенность серии – технология 100% грифеля. Во время рисования кончик постепенно обновляется, сохраняя удобную форму для работы. Это позволяет значительно дольше пользоваться карандашом и не отвлекаться на заточку. Карандаши имеют эргономичную треугольную форму, которая удобно лежит в руке и не скатывается со стола. Они подходят как для прорисовки деталей, так и для закрашивания больших участков благодаря возможности использовать боковую грань. Линейка представлена двумя сериями: Color’Peps Infinity — классические карандаши стандартного размера (наборы из 12 и 24 цветов); Color’Peps My First Jumbo Infinity — карандаши увеличенного диаметра (Jumbo), удобные для маленькой руки, рекомендованы для детей от 2 лет. Преимущества: цельная конструкция без деревянного корпуса, не требуют регулярной заточки, увеличенный срок службы, яркие и насыщенные цвета, удобная треугольная форма.",
        coverImage: "/news/maped-colorpeps.jpg",
        publishedAt: new Date("2026-08-05"),
      },
      {
        slug: "hudozhestvennye-pudry-cretacolor",
        title: "Художественные пудры Cretacolor",
        excerpt:
          "Графит, уголь, сангина и сепия для создания заливок, мягких переходов, набросков и выразительных графических эффектов.",
        body: "Художественные пудры Cretacolor – это профессиональные материалы для рисования, созданные на основе высококачественных пигментов. Они позволяют работать с большими плоскостями, создавать мягкие тональные переходы, выразительные тени и необычные графические эффекты. В отличие от традиционных карандашей или мелков, пудра даёт художнику больше свободы: её можно наносить кистью, тампоном, пальцами или использовать в сочетании с другими графическими инструментами. Материал подходит для создания широких заливок и фоновых пятен, быстрого выполнения набросков и эскизов, проработки объёма, света и тени, мягкой растушёвки и плавных переходов, получения акварельных эффектов при добавлении воды.",
        coverImage: "/news/cretacolor-powder.jpg",
        publishedAt: new Date("2026-07-30"),
      },
      {
        slug: "shkolnyj-bazar",
        title: "Школьный базар",
        excerpt:
          "Готовимся к школе вместе! На школьном базаре – тетради, канцелярия, рюкзаки, товары для творчества и всё необходимое для учебы.",
        body: "Подготовка к новому учебному году начинается со школьного базара в «СнабОфис». В наших магазинах собраны товары для школьников, студентов и дошкольников – всё необходимое для учебы, творчества и организации рабочего места. В ассортименте представлены: тетради, дневники и бумажная продукция; ручки, карандаши, фломастеры и другие письменные принадлежности; пеналы, папки и товары для хранения; рюкзаки и ранцы; товары для творчества и хобби; школьная мебель для дома; офисные и канцелярские принадлежности. Подготовиться к школе удобнее заранее: вы сможете спокойно выбрать нужные товары, сравнить варианты и приобрести всё в одном месте. Ждем вас в магазинах «СнабОфис».",
        coverImage: "/news/school-bazaar.jpg",
        publishedAt: new Date("2026-07-27"),
      },
      {
        slug: "organajzery-deli-urbanroot",
        title: "Органайзеры Deli Urbanroot",
        excerpt:
          "Серия органайзеров Urbanroot для рабочего пространства: удобные отделения, выдвижные ящики и спокойная цветовая гамма в голубом, зеленом и розовом оттенках.",
        body: "Рабочее место становится удобнее, когда каждая вещь находится на своем месте. Органайзеры Deli Urbanroot помогут организовать хранение канцелярских принадлежностей и сохранить порядок дома, в офисе или учебном пространстве. Коллекция выполнена в современном минималистичном стиле с использованием материала на основе пшеничной соломы. Нежные оттенки голубого, зеленого и розового придают органайзерам легкий и современный вид, а лаконичный дизайн гармонично вписывается в любой интерьер.",
        coverImage: "/news/deli-urbanroot.jpg",
        publishedAt: new Date("2026-07-22"),
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        slug: "price-list",
        title: "Список цен от 03.08.2026",
        description: "Розничные цены, удобно для заказа организацией",
        fileName: "snaboffice-price-list.txt",
        fileUrl: "/docs/snaboffice-price-list.txt",
        sortOrder: 1,
      },
      {
        slug: "contract",
        title: "Договор для компаний",
        description: "Типовой договор на поставку товаров",
        fileName: "snaboffice-contract.txt",
        fileUrl: "/docs/snaboffice-contract.txt",
        sortOrder: 2,
      },
    ],
  });

  await prisma.vacancy.create({
    data: {
      slug: "prodavec-konsultant",
      title: "Продавец-консультант",
      salary: "от 54 400 ₽ + премии",
      schedule: "10:00–19:00, 5/2",
      duties: "Продажа канцелярских товаров и офисного оборудования, консультации покупателей.",
      requirements:
        "Навыки работы на компьютере на уровне пользователя. Приветствуется опыт в рознице.",
      sortOrder: 1,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@snaboffice.local",
      name: "Демо Клиент",
      phone: "+7 914 000-00-00",
      companyName: "ООО Пример",
      inn: "6500000000",
      buyAsOrg: true,
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  const reviewTargets = await prisma.product.findMany({
    where: {
      slug: {
        in: [
          "podstavka-deli-urbanroot-golubaya",
          "pudra-cretacolor-grafit",
          "bumaga-svetocopy-a4-500",
        ],
      },
    },
  });

  for (const product of reviewTargets) {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: demoUser.id,
        rating: product.slug.includes("cretacolor") ? 5 : 4,
        body:
          product.slug.includes("cretacolor")
            ? "Отличная пудра для больших плоскостей, мягко растушёвывается и хорошо ложится на бумагу."
            : "Качественный товар, удобно в работе. Заказывали в розницу и для офиса.",
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        ratingAvg: product.slug.includes("cretacolor") ? 5 : 4,
        ratingCount: 1,
      },
    });
  }

  console.log(`Seed complete: ${brandsData.length} brands`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
