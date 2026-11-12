/**
 * What each subscription unlocks. RevenueCat entitlement ids must match ENTITLEMENTS.
 * Free tier keeps the table stakes: logging, reminders, Today, Journey charts, export.
 */
export const ENTITLEMENTS = ['premium', 'maintenance'] as const;
export type EntitlementId = (typeof ENTITLEMENTS)[number];

export const FEATURES = [
  'ai_insights',
  'photo_meal_logging',
  'prescriber_pdf',
  'programmes',
  'progress_cards',
  'cloud_sync',
  'maintenance_mode',
] as const;
export type Feature = (typeof FEATURES)[number];

/** The $2.99 maintenance plan keeps habits, sync and reports but not the AI features. */
export const FEATURE_ACCESS: Record<Feature, readonly EntitlementId[]> = {
  ai_insights: ['premium'],
  photo_meal_logging: ['premium'],
  prescriber_pdf: ['premium', 'maintenance'],
  programmes: ['premium', 'maintenance'],
  progress_cards: ['premium', 'maintenance'],
  cloud_sync: ['premium', 'maintenance'],
  maintenance_mode: ['premium', 'maintenance'],
};

export function hasFeature(active: readonly EntitlementId[], feature: Feature): boolean {
  return FEATURE_ACCESS[feature].some((e) => active.includes(e));
}

/** Product ids (store + RevenueCat). Configure identical ids in App Store Connect and Play Console. */
export const PRODUCT_IDS = {
  premiumAnnual: 'tortue_premium_annual',
  premiumMonthly: 'tortue_premium_monthly',
  premiumLifetime: 'tortue_premium_lifetime',
  maintenanceMonthly: 'tortue_maintenance_monthly',
} as const;
export type ProductKind = 'annual' | 'monthly' | 'lifetime' | 'maintenance_monthly';

/** RevenueCat offering ids. `default` may be swapped by an Experiment (e.g. with lifetime). */
export const OFFERING_IDS = {
  default: 'default',
  maintenance: 'maintenance',
} as const;

export const PAYWALL_TRIGGERS = ['insight_preview', 'premium_feature', 'trial_end', 'settings', 'onboarding'] as const;
export type PaywallTrigger = (typeof PAYWALL_TRIGGERS)[number];
