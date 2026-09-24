import type { Metadata } from "next";
import { Manrope, PT_Serif } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { SiteBackButton } from "@/components/SiteBackButton";
import { UiFeedbackProvider } from "@/components/UiFeedback";
import { YandexMetrika } from "@/components/YandexMetrika";
import { COMPANY, getCategoryTree, getSessionUser } from "@/lib/auth";
import "./globals.css";

const display = PT_Serif({
  variable: "--font-display",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["cyrillic", "latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "СнабОфис — интернет-магазин канцелярии и товаров для офиса",
    template: "%s · СнабОфис",
  },
  description:
    "«СнабОфис»: канцелярия, офис, школа, художественные материалы и товары для кондитеров в Москве.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "СнабОфис",
    title: "СнабОфис — канцелярия и товары для офиса",
    description:
      "Интернет-магазин и розничные магазины «СнабОфис» в Москве. Каталог, доставка, заказ для компаний и учреждений.",
    images: [{ url: "/brand/logo.svg" }],
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "СнабОфис — канцелярия и товары для офиса",
    description:
      "Интернет-магазин и магазины «СнабОфис» в Москве. Каталог, доставка, заказ для организаций.",
    images: ["/brand/logo.svg"],
  },
  icons: {
    icon: "/brand/logo.svg",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [categories, user] = await Promise.all([getCategoryTree(), getSessionUser()]);

  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <UiFeedbackProvider>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Organization",
              name: COMPANY.name,
              alternateName: COMPANY.shortName,
              url: siteUrl,
              logo: `${siteUrl.replace(/\/$/, "")}/brand/logo.svg`,
              email: COMPANY.email,
              telephone: COMPANY.phone,
              address: {
                "@type": "PostalAddress",
                streetAddress: "Коммунистический пр-кт, д. 49",
                addressLocality: "Москва",
                addressRegion: "Москва",
                postalCode: "693020",
                addressCountry: "RU",
              },
              taxID: COMPANY.inn,
            }}
          />
          <Header
            user={user ? { name: user.name, email: user.email } : null}
            categories={categories}
          />
          <SiteBackButton />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
          <YandexMetrika />
        </UiFeedbackProvider>
      </body>
    </html>
  );
}
