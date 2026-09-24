import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = { title: "Новый пароль" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token || ""} />;
}
