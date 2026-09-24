export type HomeCarouselSlide = {
  id: string;
  title: string;
  photo: string;
  /** Mobile-specific image from snaboffice.rf (visible-xs) */
  photoMobile: string;
  href: string;
  /** Text overlay like on snaboffice.rf — only for slides that have it there */
  subtitle?: string;
  showCaption?: boolean;
};

/** Exact slides from https://snaboffice.demo/ main showcase carousel */
export const HOME_CAROUSEL_SLIDES: HomeCarouselSlide[] = [
  {
    id: "school",
    title: "Школьный базар",
    photo: "/carousel/01-school.jpg",
    photoMobile: "/carousel/01-school-sm.jpg",
    href: "/catalog/tovary-dlya-detej-1175",
  },
  {
    id: "sale",
    title: "Распродажа!",
    photo: "/carousel/02-sale.jpg",
    photoMobile: "/carousel/02-sale-sm.jpg",
    href: "/catalog?filter=sale",
  },
  {
    id: "anniversary",
    title: "СнабОфису — 30 лет",
    photo: "/carousel/03-anniversary.jpg",
    photoMobile: "/carousel/03-anniversary-sm.jpg",
    href: "/about",
  },
  {
    id: "cartridge",
    title: "Распродажа картриджей",
    photo: "/carousel/04-cartridge.jpg",
    photoMobile: "/carousel/04-cartridge-sm.jpg",
    href: "/catalog/ofisnaya-bytovaya-tehnika-i-rashodnye-materialy-1018",
  },
  {
    id: "art",
    title: "ВСЁ ДЛЯ ВАШЕГО ТВОРЧЕСТВА",
    photo: "/carousel/05-art.jpg",
    photoMobile: "/carousel/05-art-sm.jpg",
    href: "/catalog/vse-dlya-tvorchestva-1158",
  },
  {
    id: "vacation",
    title: "ГОТОВЬСЯ К ПРИКЛЮЧЕНИЯМ!",
    photo: "/carousel/06-vacation.jpg",
    photoMobile: "/carousel/06-vacation-sm.jpg",
    href: "/catalog/aktivnyj-otdyh-1231",
  },
  {
    id: "party",
    title: "ВСЁ ДЛЯ ЯРКОГО ПРАЗДНИКА!",
    photo: "/carousel/07-party.jpg",
    photoMobile: "/carousel/07-party-sm.jpg",
    href: "/catalog/vse-dlya-prazdnika-1149",
  },
  {
    id: "jetstream",
    title: "Супер цена SXN-101 на Японские ручки",
    photo: "/carousel/08-jetstream.png",
    photoMobile: "/carousel/08-jetstream-sm.png",
    href: "/catalog/ruchki-sterzhni-sharikovye-1012",
  },
  {
    id: "deli-office",
    title: "Deli Лучший помощник для офиса",
    photo: "/carousel/09-deli-office.jpg",
    photoMobile: "/carousel/09-deli-office-sm.jpg",
    href: "/catalog/tovary-dlya-ofisa-833",
  },
  {
    id: "kutrio",
    title: "KU-triO® - Всегда предлагаем что-то новое",
    photo: "/carousel/10-kutrio.jpg",
    photoMobile: "/carousel/10-kutrio-sm.jpg",
    href: "/catalog",
  },
  {
    id: "deli-school",
    title: "Deli школа",
    photo: "/carousel/11-deli-school.jpg",
    photoMobile: "/carousel/11-deli-school-sm.jpg",
    href: "/catalog/tovary-dlya-detej-1175",
  },
  {
    id: "delivery",
    title: "Доставим до двери",
    photo: "/carousel/12-delivery.jpg",
    photoMobile: "/carousel/12-delivery-sm.jpg",
    href: "/delivery",
  },
  {
    id: "office",
    title: "Обеспечение офиса",
    photo: "/carousel/13-office.jpg",
    photoMobile: "/carousel/13-office-sm.jpg",
    href: "/catalog/hozyajstvennye-tovary-1073",
    subtitle:
      "хозяйственными товарами, средствами для уборки, посудой, продуктами и многим другим",
    showCaption: true,
  },
  {
    id: "candy",
    title: "Товары для кондитеров",
    photo: "/carousel/14-candy.jpg",
    photoMobile: "/carousel/14-candy-sm.jpg",
    href: "/catalog/tovary-dlya-konditerov-14105",
    subtitle: "Красители, посыпки, декор, кондитерский инвентарь и многое другое",
    showCaption: true,
  },
];
