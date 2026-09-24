import { COMPANY } from "@/lib/company";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function mailFrom() {
  return process.env.MAIL_FROM || `СнабОфис <noreply@${new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://snaboffice.demo").hostname}>`;
}

/** Send transactional email via Resend or a generic webhook. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const to = message.to.trim();
  if (!to || !to.includes("@")) return false;

  const resendKey = process.env.RESEND_API_KEY;
  const webhook = process.env.MAIL_WEBHOOK_URL || process.env.ORDER_NOTIFY_EMAIL_WEBHOOK;

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: mailFrom(),
          to: [to],
          subject: message.subject,
          text: message.text,
          html: message.html || undefined,
        }),
      });
      if (!res.ok) {
        console.error("[mail] Resend error", await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error("[mail] Resend failed", err);
      return false;
    }
  }

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: mailFrom(),
          to,
          subject: message.subject,
          text: message.text,
          html: message.html,
          source: "snab-office",
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[mail] webhook failed", err);
      return false;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[mail] to=${to}\n${message.subject}\n${message.text}`);
    return true;
  }

  console.warn("[mail] No RESEND_API_KEY or MAIL_WEBHOOK_URL configured");
  return false;
}

export function siteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mailFooterText() {
  return [
    "",
    "—",
    COMPANY.shortName,
    COMPANY.phone,
    COMPANY.email,
    siteUrl("/"),
  ].join("\n");
}
