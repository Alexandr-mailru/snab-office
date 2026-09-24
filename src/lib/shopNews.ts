/** Full news content mirrored from https://snaboffice.demo/ */

export type NewsCollageLayout = "infinity" | "cretacolor" | "school" | "urbanroot";

export type SnabOfficeNewsSeed = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  paragraphs: string[];
  gallery: string[];
  collageLayout?: NewsCollageLayout;
  /** Product name/slug keywords for related picks */
  productHints: string[];
  /** Preferred related product slugs (exact match) */
  productSlugs?: string[];
  /** Heading + lead for the product strip under the article */
  productsTitle?: string;
  productsLead?: string;
  galleryTitle?: string;
  /** Wide hero like the homepage carousel (e.g. 2280×600) */
  bannerImage?: string;
  bannerImageMobile?: string;
};

/**
 * Mosaic tiles follow each photo’s real pixel size (no crop).
 * `s` is the 12-column span; `w`/`h` set the cell aspect-ratio.
 */
export type CollageTileSpec = {
  s: number;
  w: number;
  h: number;
};

export const COLLAGE_TILES: Record<NewsCollageLayout, CollageTileSpec[]> = {
  // 2:1 banner → four 1:1 products → 1.75:1 closer
  infinity: [
    { s: 12, w: 1200, h: 600 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 12, w: 1200, h: 686 },
  ],
  // 2:1 banner → pair of 7:5 → four squares → three 7:5
  cretacolor: [
    { s: 12, w: 1200, h: 600 },
    { s: 6, w: 1200, h: 858 },
    { s: 6, w: 1200, h: 857 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 3, w: 400, h: 400 },
    { s: 4, w: 1200, h: 857 },
    { s: 4, w: 1200, h: 858 },
    { s: 4, w: 1200, h: 857 },
  ],
  // All 3:2 lookbook: opening pair, two rows of three, closing pair
  school: [
    { s: 6, w: 2000, h: 1333 },
    { s: 6, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 4, w: 2000, h: 1333 },
    { s: 6, w: 2000, h: 1333 },
    { s: 6, w: 2000, h: 1333 },
  ],
  // 2:1 banner → 7:5 + square → two squares → two 7:5 → three squares
  urbanroot: [
    { s: 12, w: 1200, h: 593 },
    { s: 7, w: 1200, h: 853 },
    { s: 5, w: 400, h: 400 },
    { s: 6, w: 400, h: 400 },
    { s: 6, w: 400, h: 400 },
    { s: 6, w: 1200, h: 853 },
    { s: 6, w: 1200, h: 853 },
    { s: 4, w: 400, h: 400 },
    { s: 4, w: 400, h: 400 },
    { s: 4, w: 400, h: 400 },
  ],
};

export function collageTileShape(w: number, h: number): "wide" | "land" | "square" {
  const ratio = w / h;
  if (ratio >= 1.7) return "wide";
  if (ratio >= 1.15) return "land";
  return "square";
}

export const SNAB_NEWS: SnabOfficeNewsSeed[] = [
  {
    slug: "maped-colorpeps-infinity",
    title: "Maped Color’Peps Infinity",
    excerpt:
      "Необычные цветные карандаши без деревянного корпуса: цельный цветной стержень, длительный срок службы, удобная треугольная форма и минимум заточки.",
    coverImage: "/news/gallery/657924-1-card.jpg",
    publishedAt: "2026-08-05",
    gallery: [
      "/news/gallery/657924-1.jpg",
      "/news/gallery/657924-2.jpeg",
      "/news/gallery/657924-3.jpeg",
      "/news/gallery/657924-4.jpeg",
      "/news/gallery/657924-5.jpeg",
      "/news/gallery/657924-6.jpg",
    ],
    productHints: ["Maped", "Color'Peps", "Infinity", "карандаш"],
    productSlugs: ["karandashi-maped-infinity-12", "karandashi-maped-infinity-24", "karandashi-maped-infinity-kidy-jumbo-12", "karandashi-maped-infinity-kidy-jumbo-metal", "nabor-maped-infinity-jungle-27", "karandashi-maped-animals-12", "karandashi-maped-duo-24", "karandashi-maped-star-24", "karandashi-maped-jumbo-12", "karandashi-maped-aqua-12"],
    galleryTitle: "Как выглядит Infinity",
    collageLayout: "infinity",
    productsTitle: "Коллекция Color’Peps Infinity",
    productsLead:
      "Монолитные карандаши без дерева — от набора на 12 цветов до Jumbo для малышей, плюс соседние серии Color’Peps для яркого старта.",
    paragraphs: [
      "Color’Peps Infinity – линейка необычных цветных карандашей от Maped, в которой привычный деревянный корпус заменен цельным цветным стержнем. Благодаря такой конструкции карандаш используется практически полностью и не требует регулярной заточки.",
      "Главная особенность серии – технология 100% грифеля. Во время рисования кончик постепенно обновляется, сохраняя удобную форму для работы. Это позволяет значительно дольше пользоваться карандашом и не отвлекаться на заточку.",
      "Карандаши имеют эргономичную треугольную форму, которая удобно лежит в руке и не скатывается со стола. Они подходят как для прорисовки деталей, так и для закрашивания больших участков благодаря возможности использовать боковую грань.",
      "Линейка представлена двумя сериями.",
      "Color’Peps Infinity — классические карандаши стандартного размера; наборы из 12 и 24 цветов; подходят для творчества, рисования и повседневного использования.",
      "Color’Peps My First Jumbo Infinity — карандаши увеличенного диаметра (Jumbo), удобные для маленькой руки; рекомендованы для детей от 2 лет.",
      "Преимущества Color’Peps Infinity: цельная конструкция без деревянного корпуса; не требуют регулярной заточки; увеличенный срок службы по сравнению с традиционными деревянными карандашами; яркие и насыщенные цвета; удобная треугольная форма; практически полностью используются без образования древесной стружки.",
      "Color’Peps Infinity – современное решение для творчества, сочетающее оригинальную конструкцию, удобство использования и долговечность. Независимо от возраста и уровня подготовки, каждый сможет выбрать подходящий вариант: классические карандаши Infinity или увеличенные My First Jumbo Infinity для самых юных художников.",
    ],
  },
  {
    slug: "hudozhestvennye-pudry-cretacolor",
    title: "Художественные пудры Cretacolor",
    excerpt:
      "Графит, уголь, сангина и сепия для создания заливок, мягких переходов, набросков и выразительных графических эффектов.",
    coverImage: "/news/gallery/657773-1-card.jpg",
    publishedAt: "2026-07-30",
    gallery: [
      "/news/gallery/657773-1.jpg",
      "/news/gallery/657773-2.jpg",
      "/news/gallery/657773-3.jpg",
      "/news/gallery/657773-4.jpeg",
      "/news/gallery/657773-5.jpeg",
      "/news/gallery/657773-6.jpeg",
      "/news/gallery/657773-7.jpeg",
      "/news/gallery/657773-8.jpg",
      "/news/gallery/657773-9.jpg",
      "/news/gallery/657773-10.jpg",
    ],
    productHints: ["Cretacolor", "пудра", "графит", "угольн", "сангин", "сепи"],
    productSlugs: ["pudra-cretacolor-grafit", "pudra-cretacolor-ugolnaya", "pudra-cretacolor-sangina", "pudra-cretacolor-sepiya", "karandash-cretacolor-ugolnyj-myagkij", "karandash-cretacolor-ugolnyj-srednij"],
    galleryTitle: "Пудры в работе",
    collageLayout: "cretacolor",
    productsTitle: "Палитра пудр Cretacolor",
    productsLead:
      "Графит, уголь, сангина и сепия — четыре тона для больших плоскостей, мягких переходов и графики, плюс угольные карандаши в пару.",
    paragraphs: [
      "Художественные пудры Cretacolor – это профессиональные материалы для рисования, созданные на основе высококачественных пигментов. Они позволяют работать с большими плоскостями, создавать мягкие тональные переходы, выразительные тени и необычные графические эффекты.",
      "В отличие от традиционных карандашей или мелков, пудра даёт художнику больше свободы: её можно наносить кистью, тампоном, пальцами или использовать в сочетании с другими графическими инструментами.",
      "Материал подходит для различных техник рисования: создания широких заливок и фоновых пятен; быстрого выполнения набросков и эскизов; проработки объёма, света и тени; мягкой растушёвки и создания плавных переходов; получения акварельных эффектов при добавлении воды; смешивания со связующими материалами для создания собственных художественных составов.",
      "Пудры особенно удобны при работе над портретами, пейзажами, учебными рисунками и крупными графическими композициями, где требуется быстро покрыть большую площадь и добиться мягких тональных переходов.",
      "В ассортименте представлены графитовые, угольные пудры, а также сангина и сепия — материалы, которые расширяют возможности работы с тоном, фактурой и светом.",
    ],
  },
  {
    slug: "shkolnyj-bazar",
    title: "Школьный базар",
    excerpt:
      "Готовимся к школе вместе! На школьном базаре – тетради, канцелярия, рюкзаки, товары для творчества и всё необходимое для учебы.",
    coverImage: "/news/gallery/school_sm.jpg",
    bannerImage: "/carousel/01-school.jpg",
    bannerImageMobile: "/carousel/01-school-sm.jpg",
    publishedAt: "2026-07-27",
    gallery: [
      "/news/gallery/657642-2.jpg",
      "/news/gallery/657642-3.jpg",
      "/news/gallery/657642-4.jpg",
      "/news/gallery/657642-5.jpg",
      "/news/gallery/657642-6.jpg",
      "/news/gallery/657642-7.jpg",
      "/news/gallery/657642-8.jpg",
      "/news/gallery/657642-9.jpg",
      "/news/gallery/657642-10.jpg",
      "/news/gallery/657642-11.jpg",
    ],
    productHints: ["тетрад", "рюкзак", "пенал", "дневник", "ножниц", "клей", "гуашь", "бумаг", "школ"],
    productSlugs: ["tetrad-polinom-48-van-gog", "ryukzak-devente-lifestyle-ghost", "penal-fenix-treugolnyj", "ruchka-stihiya-vechnyj-karandash", "bumaga-cvetnaya-artspace-8", "guash-stihiya-12", "nozhnicy-bruno-ergocut", "klej-kores-glue-eco-10", "dnevnik-unnika-shkolnicy", "penal-maped-kidy-learn"],
    galleryTitle: "Атмосфера школьного базара",
    collageLayout: "school",
    productsTitle: "Собери портфель на учебный год",
    productsLead:
      "Десять позиций для спокойного старта: тетрадь и дневник, рюкзак и пеналы, ручка, ножницы, клей, гуашь и цветная бумага — без хаоса в последний день августа.",
    paragraphs: [
      "Подготовка к новому учебному году начинается со школьного базара в «СнабОфис». В наших магазинах собраны товары для школьников, студентов и дошкольников – всё необходимое для учебы, творчества и организации рабочего места.",
      "В ассортименте представлены: тетради, дневники и бумажная продукция; ручки, карандаши, фломастеры и другие письменные принадлежности; пеналы, папки и товары для хранения; рюкзаки и ранцы; товары для творчества и хобби; школьная мебель для дома; офисные и канцелярские принадлежности.",
      "Подготовиться к школе удобнее заранее: вы сможете спокойно выбрать нужные товары, сравнить варианты и приобрести всё в одном месте.",
      "Ждем вас в магазинах «СнабОфис»:",
      "ул. Пуркаева, 110 — ежедневно с 10:00 до 19:00, телефон: 23-71-71.",
      "Коммунистический пр-т, 49 — понедельник–пятница: 9:00–18:00, суббота–воскресенье: 10:00–17:00, телефон: 22-36-36.",
      "Подготовьте всё необходимое к новому учебному году вместе с «СнабОфис».",
    ],
  },
  {
    slug: "organajzery-deli-urbanroot",
    title: "Органайзеры Deli Urbanroot",
    excerpt:
      "Серия органайзеров Urbanroot для рабочего пространства: удобные отделения, выдвижные ящики и спокойная цветовая гамма в голубом, зеленом и розовом оттенках.",
    coverImage: "/news/gallery/657430-1-card.jpg",
    publishedAt: "2026-07-22",
    gallery: [
      "/news/gallery/657430-1.jpg",
      "/news/gallery/657430-2.jpg",
      "/news/gallery/657430-3.jpeg",
      "/news/gallery/657430-4.jpeg",
      "/news/gallery/657430-5.jpeg",
      "/news/gallery/657430-6.jpg",
      "/news/gallery/657430-7.jpg",
      "/news/gallery/657430-8.jpeg",
      "/news/gallery/657430-9.jpeg",
      "/news/gallery/657430-10.jpeg",
    ],
    productHints: ["Urbanroot", "Deli", "подставка"],
    productSlugs: ["podstavka-deli-urbanroot-golubaya", "podstavka-deli-urbanroot-zelenaya", "podstavka-deli-urbanroot-rozovaya", "podstavka-deli-urbanroot-yashiki-golubaya", "podstavka-deli-urbanroot-yashiki-zelenaya", "podstavka-deli-urbanroot-yashiki-rozovaya"],
    galleryTitle: "Urbanroot в интерьере",
    collageLayout: "urbanroot",
    productsTitle: "Коллекция Deli Urbanroot",
    productsLead:
      "Компактные органайзеры и модели с ящичками — голубой, зелёный и розовый. Эко-пластик на основе пшеничной соломы и спокойный минимализм на столе.",
    paragraphs: [
      "Рабочее место становится удобнее, когда каждая вещь находится на своем месте. Органайзеры Deli Urbanroot помогут организовать хранение канцелярских принадлежностей и сохранить порядок дома, в офисе или учебном пространстве.",
      "Коллекция выполнена в современном минималистичном стиле с использованием материала на основе пшеничной соломы. Нежные оттенки голубого, зеленого и розового придают органайзерам легкий и современный вид, а лаконичный дизайн гармонично вписывается в любой интерьер.",
      "В серии представлены две модели.",
      "Deli EZ420 — компактный органайзер с четырьмя отделениями. Подходит для хранения ручек, карандашей, ножниц, линеек и других необходимых мелочей. Благодаря продуманной конструкции его также можно использовать как подставку для блокнота, ежедневника или книги.",
      "Органайзеры Urbanroot — практичное решение для организации пространства, помогающее поддерживать порядок на рабочем столе каждый день.",
    ],
  },
];

export function newsBodyFromParagraphs(paragraphs: string[]) {
  return paragraphs.join("\n\n");
}

export function getSnabOfficeNewsBySlug(slug: string) {
  return SNAB_NEWS.find((item) => item.slug === slug) ?? null;
}
