import { readLegalHtml } from "@/lib/legal";

export const metadata = { title: "Политика обработки персональных данных" };

export default function PrivacyPage() {
  const html = readLegalHtml("privacy.html");

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">152-ФЗ · ООО «СнабОфис»</p>
        <h1 className="page-title">Политика обработки персональных данных</h1>
        <p className="lead">
          Как мы обрабатываем персональные данные посетителей сайта. Также действует{" "}
          <a href="/policy/agreement">согласие на обработку ПДн</a>.
        </p>
      </div>
      <article className="panel legal-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
