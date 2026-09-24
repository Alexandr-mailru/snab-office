import { describe, expect, it } from "vitest";
import { hasCookieConsent, CONSENT_KEY } from "./cookieConsent";

describe("cookieConsent", () => {
  it("is false without window storage", () => {
    expect(hasCookieConsent()).toBe(false);
  });

  it("exports consent key", () => {
    expect(CONSENT_KEY).toBe("snaboffice-cookie-consent");
  });
});
