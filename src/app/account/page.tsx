import { redirect } from "next/navigation";
import { AccountForms } from "@/components/AccountForms";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Вход",
  description: "Вход и регистрация в личном кабинете «СнабОфис».",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AccountPage({ searchParams }: Props) {
  const user = await getSessionUser();
  const params = await searchParams;
  if (user) {
    const next = params.next;
    if (next && next.startsWith("/") && !next.startsWith("//")) redirect(next);
    redirect("/account/cabinet");
  }

  const showDemoHint = process.env.NODE_ENV !== "production";
  return <AccountForms showDemoHint={showDemoHint} nextPath={params.next} />;
}
