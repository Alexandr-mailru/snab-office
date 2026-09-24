/** Analytics / non-essential cookies are off until the user accepts. */
export const CONSENT_KEY = "snaboffice-cookie-consent";
export const CONSENT_EVENT = "snaboffice-consent";

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCookieConsent() {
  localStorage.setItem(CONSENT_KEY, "1");
}
