# Боевой запуск: Vercel + PostgreSQL + каталог из 1С

## Vercel + Postgres (бесплатно)

Схема уже на `provider = "postgresql"`. Сборка на Vercel выполняет `prisma migrate deploy`.

1. База: [Neon](https://neon.tech) (если доступен) или временная [Prisma Postgres](https://create-db.prisma.io) через `npx create-db@latest` → затем **Claim**, чтобы не удалилась через ~24ч.
2. В Vercel → Project → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://...sslmode=require
SESSION_SECRET=длинная-случайная-строка
NEXT_PUBLIC_SITE_URL=https://ваш-проект.vercel.app
ADMIN_EMAILS=ваш@email.ru
```

3. Деплой: `npx vercel --prod` (или GitHub → Import). После первого деплоя: `npm run db:seed` с тем же `DATABASE_URL` (локально или `vercel env pull`).

Каталог в проде лучше подтягивать из 1С; seed — только демо.

## Каталог из 1С (CommerceML)

Endpoint: `/api/1c/exchange`  
Auth: HTTP Basic (`ONEC_USER` / `ONEC_PASSWORD` в `.env`).

Протокол (как у Bitrix):

1. `GET ?type=catalog&mode=checkauth` → `success` + cookie
2. `GET ?type=catalog&mode=init` → `zip=no` + лимит файла
3. `POST ?type=catalog&mode=file&filename=import.xml` — тело = XML
4. `GET ?type=catalog&mode=import&filename=import.xml` — разбор сохранённого файла

Упрощённый импорт (curl):

```bash
curl -u USER:PASS -F "file=@export.xml" \
  "https://ВАШ-ДОМЕН/api/1c/exchange?mode=import"
```

Файлы обмена временно лежат в `.data/1c-exchange/` (в `.gitignore`).

Импортёр (`src/lib/commerceml.ts`) обновляет категории и товары по `externalId`.
Для полной выгрузки УТ/Розницы может понадобиться доработка разбора `ПакетПредложений` / остатков по складам.

## Уведомления о заказах

В продакшене задайте хотя бы один канал для сотрудников:

- `ORDER_NOTIFY_WEBHOOK_URL`
- или `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`

Письма клиенту (подтверждение заказа и смена статуса):

- `RESEND_API_KEY` + `MAIL_FROM`
- или `MAIL_WEBHOOK_URL`

## Админка

Emails из `ADMIN_EMAILS` получают:

- `/admin/orders` — статусы заказов
- `/admin/reviews` — модерация отзывов
- `/admin/products` — цена, остаток, флаги
- `/admin/news` — новости
- `/admin/inbox` — обратная связь и отклики на вакансии
