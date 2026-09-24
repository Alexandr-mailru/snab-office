"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, CONSENT_KEY, hasCookieConsent, setCookieConsent } from "@/lib/cookieConsent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsent());
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Согласие на cookie" aria-live="polite">
      <p>
        Мы используем cookie и сервис веб-аналитики Яндекс.Метрика, чтобы сайт работал лучше.
        Файлы cookie и аналитика подключаются только после вашего согласия. Подробнее — в{" "}
        <a href="/privacy#cookie">политике cookie</a> и{" "}
        <a href="/privacy">политике обработки персональных данных</a> (152-ФЗ).
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setCookieConsent();
          setVisible(false);
          window.dispatchEvent(new Event(CONSENT_EVENT));
        }}
      >
        Принять
      </button>
    </div>
  );
}
