/**
 * Medication catalogue schema. The catalogue is reference data shown to the user
 * (brand names, available strengths, administration rules, the manufacturer's
 * labelled titration table). It is NEVER used to recommend a dose or a change.
 */
import { z } from 'zod';

export const strengthSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['mg', 'mcg', 'units', 'ml']),
  /** Optional display label, e.g. "0.25 mg (starter pen)". */
  label: z.string().min(1).optional(),
});

export const pillRulesSchema = z.object({
  /** Must be taken on an empty stomach (e.g. first thing in the morning). */
  empty_stomach: z.boolean(),
  /** Maximum water to take it with, in ml (e.g. 120 ml / 4 fl oz). null = no limit stated. */
  water_limit_ml: z.number().positive().nullable(),
  /** Minutes to wait before eating, drinking or taking other oral medicines. null = no wait stated. */
  wait_minutes_before_food: z.number().int().positive().nullable(),
  /** Plain-English notes paraphrased from the label (no advice beyond the label). */
  notes: z.array(z.string().min(1)),
  source_url: z.url(),
});

export const titrationStepSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['mg', 'mcg', 'units', 'ml']),
  /** Weeks at this step per the label; null = maintenance / "as directed". */
  weeks: z.number().int().positive().nullable(),
  label: z.string().min(1),
});

const brandList = z.array(z.string().min(1));

export const catalogueMedicationSchema = z.object({
  /** Stable slug, e.g. "semaglutide-injection-weight". Never reuse or rename once shipped. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  generic_name: z.string().min(1),
  /** Brand names by region; omit a region where it is not marketed. Compounded entries use []. */
  brand_names: z.object({
    US: brandList.optional(),
    GB: brandList.optional(),
    CA: brandList.optional(),
    AU: brandList.optional(),
    EU: brandList.optional(),
  }),
  form: z.enum(['injection', 'pill']),
  /** Labelled indication in plain words, e.g. "Type 2 diabetes" or "Weight management". */
  indication: z.string().min(1),
  strengths: z.array(strengthSchema).min(1),
  default_schedule: z.enum(['weekly', 'daily']),
  pill_rules: pillRulesSchema.nullable(),
  /** As labelled by the manufacturer. Shown as reference only, never as a recommendation. */
  titration_steps: z.array(titrationStepSchema),
  is_compounded: z.boolean(),
  /** Show in the "top 6" chips during onboarding for these regions. */
  popular_in: z.array(z.enum(['US', 'GB', 'CA', 'AU', 'EU'])),
  sources: z
    .array(z.object({ label: z.string().min(1), url: z.url(), accessed: z.iso.date() }))
    .min(1),
  /** needs_review = a human must confirm against the current label before release. */
  verification: z.enum(['verified', 'needs_review']),
  notes: z.string().optional(),
});

export const catalogueSchema = z.object({
  /** Semver-like, bump on every content change (e.g. "2026.11.1"). */
  version: z.string().min(1),
  updated_at: z.iso.date(),
  disclaimer: z.string().min(1),
  medications: z.array(catalogueMedicationSchema).min(1),
});

export type CatalogueMedication = z.infer<typeof catalogueMedicationSchema>;
export type Catalogue = z.infer<typeof catalogueSchema>;
export type PillRules = z.infer<typeof pillRulesSchema>;
export type TitrationStep = z.infer<typeof titrationStepSchema>;
export type CatalogueStrength = z.infer<typeof strengthSchema>;
