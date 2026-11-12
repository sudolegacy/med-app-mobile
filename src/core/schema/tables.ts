/**
 * Single source of truth for table shapes. Used to:
 *  - create the on-device SQLite tables and encode/decode rows (src/db)
 *  - build sync payloads (src/sync)
 *  - assert the Postgres migrations match (tests/db/schema-parity.test.ts)
 */
import type { TableName } from '../types.ts';

export type ColumnType =
  | 'uuid'
  | 'text'
  | 'integer'
  | 'real'
  | 'boolean'
  | 'timestamptz'
  | 'date'
  | 'json'
  | 'text_array';

export interface ColumnDef {
  type: ColumnType;
  nullable: boolean;
}

/**
 * both  = written on device, synced up and down
 * down  = generated server-side (Edge Function), read-only on device
 * local = never leaves the device
 */
export type SyncDirection = 'both' | 'down' | 'local';

export interface TableDef {
  name: TableName;
  sync: SyncDirection;
  /** Columns in addition to COMMON_COLUMNS. */
  columns: Record<string, ColumnDef>;
  /** Extra uniqueness (besides id) enforced locally and in Postgres, scoped by user_id. */
  uniquePerUser?: string[];
}

const c = (type: ColumnType, nullable = false): ColumnDef => ({ type, nullable });

export const COMMON_COLUMNS: Record<string, ColumnDef> = {
  id: c('uuid'),
  user_id: c('uuid'),
  created_at: c('timestamptz'),
  updated_at: c('timestamptz'),
  deleted_at: c('timestamptz', true),
  client_updated_at: c('timestamptz'),
  version: c('integer'),
};

export const TABLES: Record<TableName, TableDef> = {
  profiles: {
    name: 'profiles',
    sync: 'both',
    uniquePerUser: [],
    columns: {
      country: c('text'),
      units: c('text'),
      goal_kind: c('text'),
      height_cm: c('real', true),
      start_weight_kg: c('real', true),
      target_weight_kg: c('real', true),
      timezone: c('text'),
      consents: c('json'),
      onboarding_completed_at: c('timestamptz', true),
      maintenance_mode_since: c('timestamptz', true),
    },
  },
  regimens: {
    name: 'regimens',
    sync: 'both',
    columns: {
      medication_id: c('text'),
      custom_name: c('text', true),
      form: c('text'),
      strength_value: c('real'),
      strength_unit: c('text'),
      schedule: c('json'),
      started_at: c('timestamptz'),
      ended_at: c('timestamptz', true),
      end_reason: c('text', true),
      source: c('text'),
      cost_cents_per_fill: c('integer', true),
      currency: c('text', true),
      fill_interval_days: c('integer', true),
    },
  },
  doses: {
    name: 'doses',
    sync: 'both',
    columns: {
      regimen_id: c('uuid'),
      taken_at: c('timestamptz'),
      strength_value: c('real'),
      strength_unit: c('text'),
      site: c('text', true),
      skipped: c('boolean'),
      note: c('text', true),
    },
  },
  symptoms: {
    name: 'symptoms',
    sync: 'both',
    columns: {
      logged_at: c('timestamptz'),
      kind: c('text'),
      severity: c('integer'),
      note: c('text', true),
      linked_dose_id: c('uuid', true),
    },
  },
  measurements: {
    name: 'measurements',
    sync: 'both',
    columns: {
      measured_at: c('timestamptz'),
      kind: c('text'),
      value: c('real'),
      source: c('text'),
      external_id: c('text', true),
    },
  },
  meals: {
    name: 'meals',
    sync: 'both',
    columns: {
      eaten_at: c('timestamptz'),
      description: c('text'),
      protein_g: c('real', true),
      fibre_g: c('real', true),
      calories: c('real', true),
      photo_path: c('text', true),
      ai_estimate: c('json', true),
      user_confirmed: c('boolean'),
    },
  },
  workouts: {
    name: 'workouts',
    sync: 'both',
    columns: {
      performed_at: c('timestamptz'),
      kind: c('text'),
      minutes: c('integer'),
      source: c('text'),
      external_id: c('text', true),
      details: c('json', true),
    },
  },
  hydration: {
    name: 'hydration',
    sync: 'both',
    columns: {
      logged_at: c('timestamptz'),
      ml: c('integer'),
    },
  },
  goals: {
    name: 'goals',
    sync: 'both',
    uniquePerUser: [],
    columns: {
      protein_g_per_day: c('real'),
      fibre_g_per_day: c('real'),
      water_ml_per_day: c('integer'),
      strength_sessions_per_week: c('integer'),
      steps_per_day: c('integer', true),
    },
  },
  insights: {
    name: 'insights',
    sync: 'down',
    uniquePerUser: ['week_start'],
    columns: {
      week_start: c('date'),
      summary_md: c('text'),
      highlights: c('json'),
      prescriber_questions: c('text_array'),
      safety_flags: c('text_array'),
      model: c('text'),
      cost_cents: c('real'),
    },
  },
  progress_cards: {
    name: 'progress_cards',
    sync: 'both',
    columns: {
      kind: c('text'),
      image_path: c('text', true),
      shared: c('boolean'),
      options: c('json', true),
    },
  },
  reminders: {
    name: 'reminders',
    sync: 'both',
    columns: {
      kind: c('text'),
      rule: c('json'),
      enabled: c('boolean'),
      regimen_id: c('uuid', true),
    },
  },
  consents: {
    name: 'consents',
    sync: 'both',
    columns: {
      kind: c('text'),
      granted: c('boolean'),
      policy_version: c('text'),
    },
  },
  exports: {
    name: 'exports',
    sync: 'both',
    columns: {
      kind: c('text'),
      status: c('text'),
    },
  },
  checkins: {
    name: 'checkins',
    sync: 'both',
    columns: {
      week_start: c('date'),
      mood: c('integer', true),
      energy: c('integer', true),
      what_changed: c('text', true),
      note: c('text', true),
    },
  },
  programme_progress: {
    name: 'programme_progress',
    sync: 'both',
    columns: {
      programme_id: c('text'),
      step_key: c('text'),
      completed_at: c('timestamptz'),
      data: c('json', true),
    },
  },
  progress_photos: {
    name: 'progress_photos',
    sync: 'local',
    columns: {
      taken_at: c('timestamptz'),
      local_uri: c('text'),
      note: c('text', true),
    },
  },
};

export const TABLE_NAMES = Object.keys(TABLES) as TableName[];
export const SYNCED_UP_TABLES = TABLE_NAMES.filter((t) => TABLES[t].sync === 'both');
export const SYNCED_DOWN_TABLES = TABLE_NAMES.filter((t) => TABLES[t].sync !== 'local');

export function allColumns(table: TableName): Record<string, ColumnDef> {
  return { ...COMMON_COLUMNS, ...TABLES[table].columns };
}
