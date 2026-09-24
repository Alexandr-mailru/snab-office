"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasCookieConsent } from "@/lib/cookieConsent";

export function YandexMetrika() {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(hasCookieConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  // Do not load Metrika (or its cookies) until explicit consent.
  if (!id || !allowed) return null;

  return (
      <Script id="yandex-metrika" strategy="afterInteractive">{`
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(${JSON.stringify(Number(id) || id)}, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true,
        ecommerce:"dataLayer"
      });
      window.dataLayer = window.dataLayer || [];
    `}</Script>
  );
}
