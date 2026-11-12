/**
 * Domain types shared by the app, the on-device database, Supabase and Edge Functions.
 *
 * Rules for everything under src/core:
 *  - pure TypeScript, no React / React Native / Expo imports (Edge Functions import a copy of this folder)
 *  - relative imports use explicit `.ts` extensions (Deno requirement)
 *  - canonical units: kg, cm, ml, grams, mmHg; timestamps are UTC ISO-8601 strings
 */

export const BASE_COUNTRIES = ['US', 'GB', 'CA', 'AU'] as const;
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
] as const;
export type EuCountry = (typeof EU_COUNTRIES)[number];
export type Country = (typeof BASE_COUNTRIES)[number] | `EU-${EuCountry}`;
/** Brand names in the catalogue are keyed by region (EU members share one list). */
export type CatalogueRegion = 'US' | 'GB' | 'CA' | 'AU' | 'EU';

export const UNITS = ['metric', 'imperial'] as const;
export type Units = (typeof UNITS)[number];

export const GOAL_KINDS = ['weight', 'maintenance', 'metabolic_health'] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export const MEDICATION_FORMS = ['injection', 'pill'] as const;
export type MedicationForm = (typeof MEDICATION_FORMS)[number];

export const SCHEDULE_KINDS = ['weekly', 'daily'] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export const STRENGTH_UNITS = ['mg', 'mcg', 'units', 'ml'] as const;
export type StrengthUnit = (typeof STRENGTH_UNITS)[number];

/** 1 = Sunday … 7 = Saturday (same convention as expo-notifications calendar/weekly triggers). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ClockTime {
  hour: number; // 0-23, device-local wall clock
  minute: number; // 0-59
}

export type DoseSchedule =
  | ({ kind: 'weekly'; weekday: Weekday } & ClockTime)
  | ({ kind: 'daily' } & ClockTime);

export const REGIMEN_SOURCES = ['prescriber', 'compounded', 'other'] as const;
export type RegimenSource = (typeof REGIMEN_SOURCES)[number];

export const REGIMEN_END_REASONS = ['stopped', 'reduced', 'switched', 'paused', 'other'] as const;
export type RegimenEndReason = (typeof REGIMEN_END_REASONS)[number];

export const INJECTION_SITES = ['abdomen_l', 'abdomen_r', 'thigh_l', 'thigh_r', 'arm_l', 'arm_r'] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

export const SYMPTOM_KINDS = [
  'nausea', 'constipation', 'diarrhea', 'fatigue', 'headache', 'reflux',
  'injection_site', 'appetite_loss', 'dizziness', 'other',
] as const;
export type SymptomKind = (typeof SYMPTOM_KINDS)[number];
export type Severity = 1 | 2 | 3 | 4 | 5;

export const MEASUREMENT_KINDS = ['weight', 'waist', 'hips', 'body_fat_pct', 'bp_sys', 'bp_dia'] as const;
export type MeasurementKind = (typeof MEASUREMENT_KINDS)[number];

export const DATA_SOURCES = ['manual', 'healthkit', 'health_connect'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export const WORKOUT_KINDS = ['strength', 'cardio', 'walk'] as const;
export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

export const REMINDER_KINDS = ['dose', 'pill_wait', 'water', 'protein_checkin', 'weigh_in', 'maintenance_checkin'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export type ReminderRule =
  | ({ type: 'weekly'; weekday: Weekday } & ClockTime)
  | ({ type: 'daily' } & ClockTime)
  | { type: 'daily_times'; times: ClockTime[] }
  /** One-off, scheduled relative to a logged dose (pill wait timer). */
  | { type: 'after_dose'; minutes: number };

export const CONSENT_KINDS = [
  'health_data_processing', // required: store/process health logs (on device; in our cloud when sync is on)
  'ai_insights', // send anonymised aggregates to Anthropic (Claude) for weekly summaries
  'ai_photo', // send meal photos to Anthropic (Claude) for protein/fibre estimates
  'health_platform_cloud_sync', // allow Apple Health / Health Connect data to be stored server-side
  'analytics', // product analytics (PostHog) — never health values
  'diagnostics', // crash reports (Sentry) — scrubbed
] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];
export interface ConsentRecord {
  granted: boolean;
  at: string;
  policy_version: string;
}
export type ConsentState = Partial<Record<ConsentKind, ConsentRecord>>;

/* ------------------------------------------------------------------ */
/* Rows                                                                 */
/* ------------------------------------------------------------------ */

/** Columns present on every synced row (see src/core/schema/tables.ts). */
export interface SyncColumns {
  id: string; // uuid, generated on device
  user_id: string; // auth uid, or LOCAL_USER_ID before an account is linked
  created_at: string;
  updated_at: string; // server-assigned once synced; pull cursor
  deleted_at: string | null; // soft delete (tombstone)
  client_updated_at: string; // last-write-wins clock
  version: number;
}
export const LOCAL_USER_ID = 'local';

export interface Profile extends SyncColumns {
  country: Country;
  units: Units;
  goal_kind: GoalKind;
  height_cm: number | null;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
  timezone: string;
  consents: ConsentState;
  onboarding_completed_at: string | null;
  maintenance_mode_since: string | null;
}

export interface Regimen extends SyncColumns {
  medication_id: string; // catalogue id
  custom_name: string | null; // free text for compounded / other
  form: MedicationForm;
  strength_value: number;
  strength_unit: StrengthUnit;
  schedule: DoseSchedule;
  started_at: string;
  ended_at: string | null;
  end_reason: RegimenEndReason | null;
  source: RegimenSource;
  cost_cents_per_fill: number | null;
  currency: string | null;
  fill_interval_days: number | null;
}

export interface Dose extends SyncColumns {
  regimen_id: string;
  taken_at: string;
  strength_value: number;
  strength_unit: StrengthUnit;
  site: InjectionSite | null; // null for pills
  skipped: boolean;
  note: string | null;
}

export interface Symptom extends SyncColumns {
  logged_at: string;
  kind: SymptomKind;
  severity: Severity;
  note: string | null;
  linked_dose_id: string | null;
}

export interface Measurement extends SyncColumns {
  measured_at: string;
  kind: MeasurementKind;
  value: number; // kg | cm | % | mmHg
  source: DataSource;
  external_id: string | null; // HealthKit / Health Connect record id (dedupe)
}

export interface MealEstimateItem {
  name: string;
  grams_est: number;
  protein_g: number;
  fibre_g: number;
  calories: number;
  confidence: number; // 0-1
}
export interface MealAiEstimate {
  items: MealEstimateItem[];
  total: { protein_g: number; fibre_g: number; calories: number };
  uncertainty_pct: number;
  model: string;
}

export interface Meal extends SyncColumns {
  eaten_at: string;
  description: string;
  protein_g: number | null;
  fibre_g: number | null;
  calories: number | null;
  photo_path: string | null; // device-local file; photos are not uploaded for storage
  ai_estimate: MealAiEstimate | null;
  user_confirmed: boolean;
}

export interface Workout extends SyncColumns {
  performed_at: string;
  kind: WorkoutKind;
  minutes: number;
  source: DataSource;
  external_id: string | null;
  details: Record<string, unknown> | null; // e.g. programme session, exercises
}

export interface Hydration extends SyncColumns {
  logged_at: string;
  ml: number;
}

export interface Goals extends SyncColumns {
  protein_g_per_day: number;
  fibre_g_per_day: number;
  water_ml_per_day: number;
  strength_sessions_per_week: number;
  steps_per_day: number | null;
}

export interface InsightHighlight {
  kind: 'adherence' | 'symptom_pattern' | 'protein' | 'weight_trend' | 'hydration' | 'activity' | 'other';
  text: string;
  evidence: Record<string, number>;
}

export interface Insight extends SyncColumns {
  week_start: string; // YYYY-MM-DD
  summary_md: string;
  highlights: InsightHighlight[];
  prescriber_questions: string[];
  safety_flags: string[];
  model: string;
  cost_cents: number;
}

export interface ProgressCard extends SyncColumns {
  kind: 'weight_change' | 'weeks_on_treatment' | 'consistency' | 'milestone';
  image_path: string | null;
  shared: boolean;
  options: { include_medication: boolean; weight_display: 'percent' | 'absolute' | 'hidden' } | null;
}

export interface Reminder extends SyncColumns {
  kind: ReminderKind;
  rule: ReminderRule;
  enabled: boolean;
  regimen_id: string | null;
}

export interface ConsentEvent extends SyncColumns {
  kind: ConsentKind;
  granted: boolean;
  policy_version: string;
}

export interface ExportRecord extends SyncColumns {
  kind: 'csv' | 'pdf' | 'prescriber_pdf';
  status: 'created' | 'shared' | 'failed';
}

export interface Checkin extends SyncColumns {
  week_start: string;
  mood: number | null; // 1-5
  energy: number | null; // 1-5
  what_changed: string | null;
  note: string | null;
}

export interface ProgrammeProgress extends SyncColumns {
  programme_id: string;
  step_key: string;
  completed_at: string;
  data: Record<string, unknown> | null;
}

/** Device-only (never synced): private progress photos. */
export interface ProgressPhoto extends SyncColumns {
  taken_at: string;
  local_uri: string;
  note: string | null;
}

export interface RowByTable {
  profiles: Profile;
  regimens: Regimen;
  doses: Dose;
  symptoms: Symptom;
  measurements: Measurement;
  meals: Meal;
  workouts: Workout;
  hydration: Hydration;
  goals: Goals;
  insights: Insight;
  progress_cards: ProgressCard;
  reminders: Reminder;
  consents: ConsentEvent;
  exports: ExportRecord;
  checkins: Checkin;
  programme_progress: ProgrammeProgress;
  progress_photos: ProgressPhoto;
}
export type TableName = keyof RowByTable;

/** Fields a caller supplies when creating a row (sync columns are filled by the repository). */
export type NewRow<T extends SyncColumns> = Omit<T, keyof SyncColumns> & { id?: string };
