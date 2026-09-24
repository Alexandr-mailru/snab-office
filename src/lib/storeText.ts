/** Keep short address / schedule tokens from wrapping mid-phrase. */

export function unbreakableAddress(text: string) {
  return text
    .replace(/\bг\.\s+/gi, "г.\u00A0")
    .replace(/\bул\.\s+/gi, "ул.\u00A0")
    .replace(/\bпр\.,\s*/gi, "пр.,\u00A0")
    .replace(/\bпр\.\s+/gi, "пр.\u00A0")
    .replace(/,\s+(\d+)\s*$/u, ",\u00A0$1");
}

export function unbreakableHours(text: string) {
  return text
    .replace(/\bс\s+(\d{1,2}:\d{2})\s+до\s+(\d{1,2}:\d{2})/gi, "с\u00A0$1\u00A0до\u00A0$2")
    .replace(/\bЕжедневно\s+[cс]\s+/gi, "Ежедневно\u00A0с\u00A0")
    .replace(/суббота\s+и\s+воскресенье/gi, "суббота\u00A0и\u00A0воскресенье")
    .replace(/Сб\s+и\s+Вс/gi, "Сб\u00A0и\u00A0Вс")
    .replace(/Пн-Чт/gi, "Пн–Чт")
    .replace(/Пн–Чт\s+/gi, "Пн–Чт\u00A0")
    .replace(/Пт\s+с\s+/gi, "Пт\u00A0с\u00A0")
    .replace(/Сб\s+и\s+Вс\s+/gi, "Сб\u00A0и\u00A0Вс\u00A0");
}

export function storeDescriptionLines(description: string) {
  const parts = description
    .split(/(?<=\.)\s+(?=[А-ЯЁA-Z])/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [description.trim()];
}
