import { CartView } from "@/components/CartView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Корзина",
  description: "Корзина интернет-магазина «СнабОфис».",
};

export default async function CartPage() {
  const user = await getSessionUser();
  return <CartView isLoggedIn={Boolean(user)} />;
}
