import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { PhoneLink } from "@/components/PhoneText";
import { COMPANY } from "@/lib/auth";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <BrandLogo variant="footer" className="footer-logo" />
          <p className="muted">
            Канцелярия, офис, школа, художественные материалы и товары для кондитеров в Москве.
          </p>
          <p className="footer-reqs">
            <strong>{COMPANY.name}</strong>
            <br />
            <span className="footer-reqs-line">
              ИНН {COMPANY.inn}
              <span aria-hidden> · </span>
              ОГРН {COMPANY.ogrn}
            </span>
            <br />
            <span className="footer-reqs-line">{COMPANY.address}</span>
            <br />
            <span className="footer-reqs-line">
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
              <span aria-hidden> · </span>
              <PhoneLink phone={COMPANY.phone} />
            </span>
          </p>
        </div>
        <div>
          <p className="footer-title">Покупателям</p>
          <Link href="/catalog">Каталог</Link>
          <Link href="/delivery">Доставка</Link>
          <Link href="/returns">Возврат и обмен</Link>
          <Link href="/offer">Публичная оферта</Link>
          <Link href="/stores">Адреса магазинов</Link>
          <Link href="/brands">Бренды</Link>
          <Link href="/news">Новости</Link>
        </div>
        <div>
          <p className="footer-title">Компания и документы</p>
          <Link href="/about">О компании</Link>
          <Link href="/corporate">Для организаций</Link>
          <Link href="/feedback">Обратная связь</Link>
          <Link href="/vacancies">Вакансии</Link>
          <Link href="/privacy">Политика ПДн (152-ФЗ)</Link>
          <Link href="/policy/agreement">Согласие на обработку ПДн</Link>
          <Link href="/privacy#cookie">Политика cookie</Link>
          <Link href="/account">Личный кабинет</Link>
          <a href="https://vk.com/td_snaboffice" target="_blank" rel="noreferrer">
            ВКонтакте
          </a>
        </div>
        <div>
          <p className="footer-title">Контакты</p>
          <PhoneLink phone="(4242) 22-36-36" />
          <span className="footer-phone-row">
            Для организаций <PhoneLink phone="(4242) 22-19-22" />
          </span>
          <span className="footer-phone-row">
            Telegram <PhoneLink phone="+7 914 755-34-67" />
          </span>
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          <p className="muted">Коммунистический пр., 49</p>
          <p className="muted">ул. Пуркаева, 110</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © 2006–2026 {COMPANY.name} · ИНН {COMPANY.inn} · ОГРН {COMPANY.ogrn}
        </span>
        <span>Демо новой витрины</span>
      </div>
    </footer>
  );
}
