import Link from "next/link";

export const metadata = { title: "Доставка" };

export default function DeliveryPage() {
  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Сервис</p>
        <h1 className="page-title">О доставке</h1>
        <p className="lead">
          Бесплатная доставка по Москве при заказе от 2000 ₽. Самовывоз — из двух магазинов.
        </p>
      </div>
      <article className="panel content-narrow">
        <p>
          Бесплатная доставка осуществляется в будние дни по Москве и пригородам при
          заказе на сумму более 2000 ₽. Возможность доставки заказа по Москве и области оговаривается с
          менеджером.
        </p>
        <p>При меньшей сумме заказа — самовывоз.</p>
        <div className="cta-row cta-row-spaced">
          <Link href="/catalog" className="btn btn-primary">
            В каталог
          </Link>
          <Link href="/stores" className="btn btn-secondary">
            Адреса самовывоза
          </Link>
        </div>
      </article>
    </div>
  );
}
