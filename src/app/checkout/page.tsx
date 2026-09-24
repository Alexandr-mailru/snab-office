import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа в интернет-магазине «СнабОфис».",
};

type Props = {
  searchParams: Promise<{ forOrg?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/account?next=${encodeURIComponent("/checkout")}`);
  }

  const params = await searchParams;
  const fromQuery = params.forOrg === "1" || params.forOrg === "true";
  const defaults = {
    customerName: user.name || "",
    customerPhone: user.phone || "",
    customerEmail: user.email || "",
    companyName: user.companyName || "",
    inn: user.inn || "",
  };

  return (
    <CheckoutForm
      defaults={defaults}
      initialForOrg={fromQuery || Boolean(user.buyAsOrg)}
    />
  );
}
