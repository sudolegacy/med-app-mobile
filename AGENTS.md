# AGENTS.md — Tortue (GLP-1 companion, iOS + Android)

Read this before changing anything. It applies to humans and AI agents.

## Product guardrails (non-negotiable)

- **General wellness only.** Logging, reminders, education, habit support. Never diagnose, treat, or manage disease.
- **No dosing advice.** No titration recommendations, no "increase/decrease/skip/stop" suggestions, no medication-level (pharmacokinetic) charts. The catalogue's titration tables are shown as *reference from the label*, never as a plan.
- Every insight screen shows the footer: "Informational only. Talk to your prescriber before changing anything." (`src/copy`).
- When choosing between "more features" and "safer wording", choose safer wording.
- Health data is sensitive: no health values in analytics (`src/core/analytics/events.ts` is the only allowed event contract), no third-party ad SDKs, AI calls only through Supabase Edge Functions after explicit consent naming Anthropic.

## Layout

- `src/app/` — Expo Router routes only (every file is a screen). Keep logic in `src/features/*`.
- `src/core/` — pure TypeScript domain logic shared with Edge Functions. **No React/RN/Expo imports, no `@/` alias, relative imports must end in `.ts`, only external import allowed is `zod`.** `npm run core:sync` copies it into `supabase/functions/_shared/core/`.
- `src/db/` — on-device SQLite (expo-sqlite): migrations, row codecs, repositories, outbox. All writes go through repositories so they are queued for sync.
- `src/sync/` — outbox push / pull with last-write-wins on `client_updated_at`.
- `src/services/` — adapters for native/3rd-party SDKs (notifications, auth, purchases, analytics, health, supabase).
- `src/ui/` — design tokens and reusable components. `src/copy/` — all user-facing strings (en-US base, en-GB overrides).
- `supabase/` — migrations, RLS, seed, Edge Functions (Deno). `tests/` — Vitest suites (core, db via PGlite, golden AI tests).
- `docs/` — plans per phase, compliance, listings, legal drafts (flagged for counsel).

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK 58-compatible versions
npm run typecheck           # tsc --noEmit
npm run lint                # eslint
npm test                    # vitest (core, db, golden)
npm run test:rn             # jest-expo + React Native Testing Library (*.rn.test.tsx)
npm run core:sync           # refresh the Edge Functions' copy of src/core
```

Run typecheck, lint and tests before declaring work done. Never weaken a test to make it pass.

## Expo

Expo ships breaking changes every SDK. This project is on **Expo SDK 58 / React Native 0.88 (New Architecture)**. Before touching an Expo API, read the versioned docs at `https://docs.expo.dev/versions/v58.0.0/` (index: https://docs.expo.dev/llms.txt) or the installed type definitions in `node_modules`. `ios/` and `android/` are generated (Continuous Native Generation) — configure native behaviour in `app.config.ts` and config plugins only. Native modules require a development build (`eas build --profile development`), not Expo Go.
