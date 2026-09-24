/** Old short catalog slugs → SnabOffice SECTION tree slugs */
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  ofis: "tovary-dlya-ofisa-833",
  kancelyariya: "melko-ofisnaya-kancelyariya-855",
  bumaga: "bumaga-i-bumazhnye-izdeliya-1112",
  hudozhestvennye: "vse-dlya-tvorchestva-1158",
  shkola: "tovary-dlya-detej-1175",
  konditeram: "tovary-dlya-konditerov-14105",
  prazdnik: "vse-dlya-prazdnika-1149",
  tehnika: "ofisnaya-bytovaya-tehnika-i-rashodnye-materialy-1018",
  hoztoivary: "hozyajstvennye-tovary-1073",
  organajzery: "podstavki-dlya-kalendarej-kancprinadlezhnostej-1087",
  karandashi: "detskie-tovary-ruchki-linejki-nozhnicy-klej-flomastery-karan-1180",
  ruchki: "ruchki-sterzhni-sharikovye-1012",
};

export function resolveCategorySlug(slug: string) {
  return LEGACY_CATEGORY_ALIASES[slug] ?? slug;
}
