import { readLegalHtml } from "@/lib/legal";

export const metadata = { title: "Согласие на обработку персональных данных" };

export default function AgreementPage() {
  const html = readLegalHtml("agreement.html");

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">152-ФЗ</p>
        <h1 className="page-title">Согласие на обработку персональных данных</h1>
        <p className="lead">
          Форма согласия посетителя сайта. См. также{" "}
          <a href="/privacy">политику обработки персональных данных</a>.
        </p>
      </div>
      <article className="panel legal-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
