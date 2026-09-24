/** Keep phone numbers from wrapping mid-token. */
export function unbreakablePhone(text: string) {
  return text.replace(/(\+?\d|\()[\d\s()\-]{5,}\d/g, (match) =>
    match.replace(/-/g, "\u2011").replace(/ /g, "\u00A0"),
  );
}

export function toTelHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  if (digits.length === 10) return `tel:+7${digits}`;
  if (digits.startsWith("8") && digits.length === 11) return `tel:+7${digits.slice(1)}`;
  if (digits.startsWith("7")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}
