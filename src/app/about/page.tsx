import Link from "next/link";

export const metadata = {
  title: "О компании",
  description:
    "«СнабОфис» в Москве: канцелярия, офис, школа и товары для творчества. Более 20 лет на рынке, 17 000 позиций, лауреат «Золотой скрепки».",
};

const STATS = [
  { value: "20+", label: "лет на рынке" },
  { value: "17 000", label: "наименований" },
  { value: "1500 м²", label: "торговых и складских площадей" },
  { value: "2000+", label: "партнёров в Москве и области" },
];

const PILLARS = [
  {
    title: "Опыт и развитие",
    text: "Динамично развивающаяся компания с опытом работы на рынке канцелярских товаров и офисной техники.",
  },
  {
    title: "Команда",
    text: "Профессионалы, готовые предоставить квалифицированный сервис и помочь в выборе товаров.",
  },
  {
    title: "Ассортимент",
    text: "Широкий выбор: более 17 000 наименований — от офиса и школы до творчества и праздника.",
  },
  {
    title: "Склад и сборка",
    text: "Около 1500 м² помещений с оборудованием для сборки заказов любой сложности.",
  },
];

const CATALOG = [
  "Канцелярские товары",
  "Бумага для офисной техники",
  "Презентационное оборудование",
  "Офисная техника и расходники",
  "Офисные часы и светильники",
  "Товары для школы",
  "Товары для творчества",
  "Товары для кондитеров",
  "Праздничное оформление",
  "Сувениры и бизнес-подарки",
  "Гигиенические и хозяйственные товары",
];

const AWARDS = [
  {
    year: "2005",
    title: "Лидер корпоративного обслуживания региона",
    text: "Выдвижение АПКОР на Национальную премию «Золотая скрепка» — в числе пяти лучших компаний Восточной Сибири и Дальнего Востока.",
  },
  {
    year: "2007",
    title: "Лидер корпоративного обслуживания ДФО",
    text: "Выдвижение на номинацию «Лучшая оптовая компания Дальневосточного региона». Национальная премия «Золотая скрепка».",
  },
  {
    year: "2009",
    title: "Компания года Дальневосточного региона",
    text: "Национальная премия рынка канцелярских и офисных товаров «Золотая скрепка».",
  },
  {
    year: "2012",
    title: "Компания года Дальневосточного региона",
    text: "Повторное награждение Национальной премией «Золотая скрепка».",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1 className="sr-only">О компании — Торговый дом СнабОфис</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.svg"
            alt=""
            className="about-brand-logo"
            width={520}
            height={95}
          />
          <p className="about-hero-lead">
            В Москве: канцелярия, офис, школа и товары для творчества.
          </p>
          <p className="about-hero-text">
            «СнабОфис» — компания на рынке канцелярских товаров и офисной техники более
            20 лет.
          </p>
          <div className="cta-row about-hero-actions">
            <Link href="/catalog" className="btn btn-primary">
              В каталог
            </Link>
            <Link href="/stores" className="btn btn-secondary">
              Магазины
            </Link>
            <Link href="/corporate" className="btn btn-ghost">
              Для организаций
            </Link>
          </div>
        </div>
        <div className="about-hero-glow" aria-hidden />
        <div className="about-hero-grid" aria-hidden />
      </section>

      <section className="about-stats" aria-label="Ключевые факты">
        {STATS.map((stat) => (
          <div key={stat.label} className="about-stat">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <h2>СнабОфис — это</h2>
          <p>Сервис, ассортимент и инфраструктура для частных клиентов и организаций.</p>
        </div>
        <div className="about-pillars">
          {PILLARS.map((item) => (
            <article key={item.title} className="about-pillar">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section about-catalog-section">
        <div className="about-section-head">
          <h2>В нашем каталоге</h2>
          <p>Всё для офиса, школы, творчества и праздника — в одном торговом доме.</p>
        </div>
        <ul className="about-catalog-list">
          {CATALOG.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link href="/catalog" className="btn btn-secondary">
          Смотреть категории
        </Link>
      </section>

      <section className="about-section about-awards-section">
        <div className="about-section-head">
          <h2>Награды</h2>
          <p>
            Победитель и лауреат премий на рынке канцелярских товаров и офисной техники —
            Национальная премия «Золотая скрепка».
          </p>
        </div>
        <ol className="about-awards">
          {AWARDS.map((award) => (
            <li key={award.year} className="about-award">
              <div className="about-award-medal" aria-hidden>
                <span className="about-award-year">{award.year}</span>
                <span className="about-award-clip" />
              </div>
              <div className="about-award-body">
                <h3>{award.title}</h3>
                <p>{award.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-closing">
        <blockquote>
          Главные преимущества компании — тщательно подобранный ассортимент по современным новинкам
          и тенденциям рынка, высокая квалификация сотрудников, внимательное отношение к
          потребностям клиентов и нацеленность на долгосрочное сотрудничество.
        </blockquote>
        <p className="about-closing-partners">
          Более 2000 предприятий Москвы и области уже стали нашими постоянными
          партнёрами и оценили сервис и качество товаров.
        </p>
        <p className="about-closing-invite">Мы будем рады видеть вас в числе наших клиентов!</p>
        <div className="cta-row">
          <Link href="/checkout?forOrg=1" className="btn btn-primary">
            Заказать для компании
          </Link>
          <Link href="/stores" className="btn btn-secondary">
            Приехать в магазин
          </Link>
        </div>
      </section>
    </div>
  );
}
