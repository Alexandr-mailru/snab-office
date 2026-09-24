# СнабОфис

Демо полноценного интернет-магазина «СнабОфис» (Москва): витрина, корзина, оформление заказа, страницы магазинов, раздел для организаций, новости и обмен с 1С (CommerceML).

## Стек

- Next.js (App Router) + TypeScript
- SQLite + Prisma (для прода — PostgreSQL, см. [docs/PRODUCTION.md](docs/PRODUCTION.md))
- Zustand (корзина)
- Endpoint `/api/1c/exchange` под выгрузку CommerceML

## Быстрый старт

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Импорт тестовой выгрузки 1С

Нужны `ONEC_USER` / `ONEC_PASSWORD` в `.env`.

```bash
curl -u USER:PASS -F "file=@fixtures/sample-commerceml.xml" \
  "http://localhost:3000/api/1c/exchange?mode=import"
```

Или попросите у бухгалтера/IT файл обмена из **1С:Розница / УТ** (CommerceML) и загрузите его тем же запросом. Полный цикл `checkauth → init → file → import` описан в [docs/PRODUCTION.md](docs/PRODUCTION.md).

## Что уже есть

- Главная: витрина/баннеры, новинки, распродажа, категории
- Каталог с деревом категорий, поиск, бренды
- Корзина, оформление заказа (с prefill из профиля), доставка
- Атомарное списание остатков, уникальные номера заказов, уведомления (webhook/Telegram)
- Админка: статусы заказов (`/admin/orders`), модерация отзывов
- О компании, политика ПДн, cookie + Яндекс.Метрика (по согласию)
- Кабинет: вход/регистрация (`demo@snaboffice.local` / `demo1234` в dev)
- Для организаций: список цен и договор
- Обратная связь, вакансии, карты магазинов
- `externalId` у товаров/категорий + endpoint `/api/1c/exchange`
- SEO: sitemap, robots, Open Graph, JSON-LD Organization/Product

## Безопасность и 1С

В `.env` (см. `.env.example`):

```env
SESSION_SECRET=длинный-случайный-секрет
ONEC_USER=onec_demo
ONEC_PASSWORD=пароль-обмена
ADMIN_EMAILS=demo@snaboffice.local
```

Обмен: `GET/POST /api/1c/exchange` только с HTTP Basic Auth.

## Уведомления о заказах

```env
ORDER_NOTIFY_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Метрика

В `.env` задайте `NEXT_PUBLIC_YANDEX_METRIKA_ID=XXXXXXXX` — счётчик грузится только после «Хорошо» в cookie-баннере.

## Что дальше для боевого запуска

См. [docs/PRODUCTION.md](docs/PRODUCTION.md): PostgreSQL, каталог из 1С, уведомления, домен.
