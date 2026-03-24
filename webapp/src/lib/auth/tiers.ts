/**
 * Subscription Tier Definitionen und Feature-Gating.
 *
 * Basis (kostenlos): Kaufnebenkosten-Rechner, Preis-Tracker (max 20)
 * Starter (€19/Monat): + Stadtteil-Analyse, Mietpreisspiegel, unbegrenzter Tracker
 * Pro (€39/Monat): + Exposé-Generator, Mini-CRM, Bodenrichtwerte, CSV-Export
 */

export type Tier = "basis" | "starter" | "pro";

export type Feature =
  | "kaufnebenkosten_rechner"
  | "preis_tracker_20"
  | "preis_tracker_unlimited"
  | "stadtteil_analyse"
  | "mietpreisspiegel"
  | "expose_generator"
  | "mini_crm"
  | "bodenrichtwerte"
  | "csv_export";

const TIER_FEATURES: Record<Tier, Feature[]> = {
  basis: ["kaufnebenkosten_rechner", "preis_tracker_20"],
  starter: [
    "kaufnebenkosten_rechner",
    "preis_tracker_unlimited",
    "stadtteil_analyse",
    "mietpreisspiegel",
  ],
  pro: [
    "kaufnebenkosten_rechner",
    "preis_tracker_unlimited",
    "stadtteil_analyse",
    "mietpreisspiegel",
    "expose_generator",
    "mini_crm",
    "bodenrichtwerte",
    "csv_export",
  ],
};

const TIER_ORDER: Tier[] = ["basis", "starter", "pro"];

export function hasFeature(tier: string, feature: Feature): boolean {
  const features = TIER_FEATURES[tier as Tier];
  if (!features) return false;
  return features.includes(feature);
}

export function tierIncludes(currentTier: string, requiredTier: Tier): boolean {
  const currentIdx = TIER_ORDER.indexOf(currentTier as Tier);
  const requiredIdx = TIER_ORDER.indexOf(requiredTier);
  return currentIdx >= requiredIdx;
}

export function getRequiredTier(feature: Feature): Tier {
  for (const tier of TIER_ORDER) {
    if (TIER_FEATURES[tier].includes(feature)) return tier;
  }
  return "pro";
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "basis": return "Basis (kostenlos)";
    case "starter": return "Starter (€19/Monat)";
    case "pro": return "Pro (€39/Monat)";
    default: return tier;
  }
}
