import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/reviews";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!isAdminEmail(user.email)) redirect("/account/cabinet");
  return user;
}
