/**
 * Product analytics contract. PostHog receives ONLY these events and ONLY these
 * properties: booleans, non-negative integer counts/durations, or values from a
 * fixed enum. Never weights, doses, strengths, symptoms, severities, nutrition,
 * medication names or free text. tests/analytics/no-health-values.test.ts enforces this.
 */
import { z } from 'zod';
import { PAYWALL_TRIGGERS } from '../entitlements.ts';
import { MEDICATION_FORMS, REMINDER_KINDS } from '../types.ts';

const count = z.number().int().nonnegative();
const flag = z.boolean();
const product = z.enum(['annual', 'monthly', 'lifetime', 'maintenance_monthly']);

export const ONBOARDING_STEPS = [
  'welcome',
  'consent',
  'sign_in',
  'medication',
  'strength',
  'schedule',
  'reminder',
  'goals',
  'done',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ANALYTICS_EVENTS = {
  app_open: z.object({ cold_start: flag }),
  onboarding_step_viewed: z.object({ step: z.enum(ONBOARDING_STEPS) }),
  onboarding_step_completed: z.object({ step: z.enum(ONBOARDING_STEPS), seconds_since_start: count }),
  onboarding_sign_in_skipped: z.object({}),
  onboarding_completed: z.object({ seconds_since_start: count, signed_in: flag }),
  first_regimen_set: z.object({ form: z.enum(MEDICATION_FORMS) }),
  regimen_set: z.object({ form: z.enum(MEDICATION_FORMS) }),
  first_reminder_scheduled: z.object({ seconds_since_start: count }),
  reminder_scheduled: z.object({ kind: z.enum(REMINDER_KINDS) }),
  exact_alarm_permission: z.object({ granted: flag }),
  notification_permission: z.object({ granted: flag }),
  first_dose_logged: z.object({}),
  dose_logged: z.object({ via: z.enum(['app', 'notification']) }),
  symptom_logged: z.object({ via: z.enum(['today_chip', 'log']) }),
  meal_logged: z.object({ method: z.enum(['text', 'photo']) }),
  weighin_logged: z.object({ source: z.enum(['manual', 'health']) }),
  water_logged: z.object({}),
  workout_logged: z.object({ source: z.enum(['manual', 'health']) }),
  health_connected: z.object({ platform: z.enum(['healthkit', 'health_connect']) }),
  insight_viewed: z.object({ preview: flag }),
  prescriber_pdf_exported: z.object({}),
  progress_card_created: z.object({ includes_medication: flag }),
  progress_card_shared: z.object({}),
  paywall_viewed: z.object({ trigger: z.enum(PAYWALL_TRIGGERS) }),
  paywall_dismissed: z.object({ trigger: z.enum(PAYWALL_TRIGGERS) }),
  trial_started: z.object({ product }),
  subscription_started: z.object({ product }),
  renewed: z.object({ product }),
  cancel_flow_viewed: z.object({}),
  maintenance_mode_selected: z.object({}),
  pause_selected: z.object({}),
  programme_started: z.object({ programme: z.enum(['protein', 'strength', 'hydration', 'fibre', 'pill_era', 'maintenance']) }),
  export_requested: z.object({ format: z.enum(['csv', 'pdf']) }),
  account_deleted: z.object({}),
  sync_completed: z.object({ pushed: count, pulled: count }),
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;
export type AnalyticsEventProps<E extends AnalyticsEventName> = z.infer<(typeof ANALYTICS_EVENTS)[E]>;

/**
 * Validates and strips an event payload. Unknown keys are dropped; invalid values
 * cause the event to be discarded (returns null) rather than sent.
 */
export function sanitizeEvent<E extends AnalyticsEventName>(
  name: E,
  props: unknown,
): AnalyticsEventProps<E> | null {
  const schema = ANALYTICS_EVENTS[name];
  if (!schema) return null;
  const parsed = schema.safeParse(props ?? {});
  return parsed.success ? (parsed.data as AnalyticsEventProps<E>) : null;
}
