import { z } from "zod";

/** Accept checkbox boolean or form string values. */
export const consentField = z
  .union([z.literal(true), z.literal("true"), z.literal("on")])
  .transform(() => true as const);
