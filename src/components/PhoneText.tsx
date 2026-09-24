import type { ReactNode } from "react";
import { toTelHref, unbreakablePhone } from "@/lib/phone";

/** Renders text with phone numbers as non-wrapping tel links when possible. */
export function PhoneText({ text, asLinks = true }: { text: string; asLinks?: boolean }) {
  const parts: ReactNode[] = [];
  const re = /(\+?\d|\()[\d\s()\-]{5,}\d/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const raw = match[0];
    const display = unbreakablePhone(raw);
    const href = asLinks ? toTelHref(raw) : undefined;
    if (href) {
      parts.push(
        <a key={key} href={href} className="tel-nowrap">
          {display}
        </a>,
      );
    } else {
      parts.push(
        <span key={key} className="tel-nowrap">
          {display}
        </span>,
      );
    }
    key += 1;
    last = match.index + raw.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  if (!parts.length) return <>{unbreakablePhone(text)}</>;
  return <>{parts}</>;
}

export function PhoneLink({ phone, className }: { phone: string; className?: string }) {
  const href = toTelHref(phone);
  const display = unbreakablePhone(phone);
  if (!href) {
    return <span className={`tel-nowrap ${className ?? ""}`.trim()}>{display}</span>;
  }
  return (
    <a href={href} className={`tel-nowrap ${className ?? ""}`.trim()}>
      {display}
    </a>
  );
}
