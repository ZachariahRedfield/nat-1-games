# FAWXZZY_ARCHITECTURE_PLAN

## 1) System Shape (Target)

- **Architecture:** Modular monolith in Next.js App Router.
- **Primary backend:** Supabase (Postgres, Auth, RLS, Edge Functions, scheduled jobs).
- **Client stack:** Tailwind + PWA shell + IndexedDB for offline queue/cache.
- **Design goal:** mobile-first logging speed with analytics-grade data integrity.

---

## 2) Module Boundaries

### `auth`
- Session bootstrap, account metadata, role/membership context.

### `workouts`
- Program templates, scheduled workouts, active session lifecycle.

### `logging`
- Set-level entry, drafts, local queue, sync submission.

### `progression`
- Progressive overload recommendation engine + acceptance workflow.

### `pr-tracking`
- PR detection events and recalculation services.

### `analytics`
- Read models, rollups, reporting APIs, trend endpoints.

### `shared/core`
- Validation schemas, date/units utilities, domain constants, telemetry contracts.

Rule: modules communicate only through exported services/contracts.

---

## 3) Data Architecture (Supabase)

## Core operational tables
- `profiles`
- `programs`
- `program_blocks`
- `workout_templates`
- `workout_sessions`
- `exercise_entries`
- `set_logs`
- `session_notes`
- `pr_events`
- `overload_recommendations`

## Relationship pattern
- `profiles 1:N workout_sessions`
- `workout_sessions 1:N exercise_entries`
- `exercise_entries 1:N set_logs`
- `set_logs -> pr_events` (derived/event-generated)
- `programs -> workout_templates -> planned exercise targets`

## Analytics read layer
- Materialized views:
  - `mv_weekly_volume`
  - `mv_adherence`
  - `mv_pr_velocity`
  - `mv_plateau_signals`
- Scheduled refresh and incremental rollup jobs.

---

## 4) Supabase RLS Plan

Apply to every user-owned table:

- **Select policy:** user can read rows where `user_id = auth.uid()`.
- **Insert policy:** user can insert rows where `user_id = auth.uid()`.
- **Update policy:** user can update rows where `user_id = auth.uid()`.
- **Delete policy:** restricted; prefer soft delete where business critical.

For coach/client collaboration:
- Add `coach_client_links (coach_id, client_id, status)`.
- Policies permit coach read access to linked clients only when `status = 'active'`.
- Write permissions remain scoped (coach notes/program assignment only).

Guardrails:
- no table merged without RLS tests,
- no role checks sourced only from client payload.

---

## 5) Offline + Sync Plan

## Local persistence
- IndexedDB stores:
  - `session_drafts`,
  - `mutation_queue`,
  - `cached_summaries`.

## Sync protocol
1. Client mutation created with `client_mutation_id`, `device_id`, `created_at`.
2. Mutation persisted locally, UI updates immediately.
3. Background flush posts to Supabase API/Edge endpoint.
4. Server upserts idempotently by `client_mutation_id`.
5. Ack removes queue item and updates sync cursor.

## Conflict strategy
- `set_logs`: last-write-wins + user notice.
- `workout_sessions`: server-version precondition; if mismatch, return merge payload.
- `program updates`: explicit review/accept flow.

---

## 6) Progressive Overload Architecture

## Inputs
- recent completion/adherence,
- set performance trends,
- fatigue proxy metrics (RPE drift, failure flags),
- configured program goals.

## Engine
- Deterministic rule engine in server-side service layer.
- Recommendation outputs persisted to `overload_recommendations`.
- Optional model-assisted suggestions can be layered later, but deterministic baseline remains source of truth.

## Lifecycle
- nightly generation job,
- user acceptance/ignore actions,
- acceptance updates next workout targets.

---

## 7) PR Tracking Architecture

- PR detection runs after log ingest and on recalculation jobs.
- Store PR events as immutable records with:
  - metric type,
  - previous best,
  - new best,
  - source set/session.
- Backfill job can recompute PR history from `set_logs` to repair logic changes.

---

## 8) Analytics & Reporting Readiness

- Event-first operational model enables re-computation.
- Create stable semantic metrics catalog (volume, intensity, frequency, adherence, PR velocity).
- API routes for analytics should read from rollups/views, not raw heavy joins.
- Add data contract tests to prevent metric drift when schema evolves.

---

## 9) Mobile-first Performance Plan

- Prioritize log-entry route performance budget (TTI and interaction latency).
- Keep primary logging UI mostly client-local and lightweight.
- Use route-level code splitting and lazy-load non-critical analytics screens.
- PWA strategy:
  - app shell caching,
  - offline fallback route,
  - queued writes replay.
- Instrument web vitals and track slow-device cohorts.

---

## 10) Delivery Workflow and Governance

- Required checks per PR:
  - lint,
  - typecheck,
  - unit tests,
  - integration tests (RLS and sync),
  - offline scenario tests for logging.
- Changelog entries required for behavior/data workflow changes (WHAT + WHY).
- Migration PR checklist:
  - schema migration,
  - RLS changes,
  - backfill/rollup impact,
  - rollback path.

---

## 11) Phased Implementation Roadmap

## Phase 1: Foundation
- Auth/profile + base RLS
- Workout logging core schema
- Offline draft + queue MVP

## Phase 2: Reliability
- Idempotent sync endpoint
- Conflict handling UX
- PR event generation

## Phase 3: Intelligence
- Overload rule engine
- Recommendation lifecycle UI
- Analytics rollups + dashboards

## Phase 4: Scale hardening
- Query/index optimization
- Background job observability
- Multi-role collaboration expansion
