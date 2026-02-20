# FAWXZZY_ENGINEERING_PLAYBOOK

## Purpose

This playbook adapts the reusable engineering doctrine from Nat-1 into a **mobile-first fitness SaaS context** (Next.js App Router + Supabase + Tailwind + PWA offline logging).

It defines which patterns should be kept, simplified, dropped, and added for long-term scalability.

---

## 1) Core Principles for Fawxzzy

1. **Bounded modules, shared contracts**
   - Keep workout logging, programming, analytics, and auth as separate modules.
   - Share only typed contracts/schemas across modules.

2. **Deterministic state and auditable mutations**
   - All training-log mutations must be traceable (who/when/what changed).
   - Derived metrics are reproducible from source events.

3. **Offline-first by default**
   - Logging a set should work without network.
   - Sync reliability and conflict handling are first-class product behavior.

4. **Security is data-layer enforced**
   - Client checks improve UX, but Supabase RLS is the true boundary.

5. **Analytics-ready from day one**
   - Event schemas and relational design should support cohort/performance reporting without costly rewrites.

---

## 2) Pattern Transfer Matrix

## A. Patterns that transfer directly

- **Modular monolith boundaries** (feature modules + shared core).
- **Service layer between UI and persistence/APIs**.
- **Versioned persisted schemas + migration discipline**.
- **Provider/capability detection with graceful fallback**.
- **CI/verification discipline + changelog expectations**.
- **Fail-safe auth/session cleanup behavior**.

## B. Patterns to simplify

- **Storage provider orchestration**
  - Keep a lightweight `SyncOrchestrator` instead of many storage backends.
  - Primary cloud truth = Supabase; local cache = IndexedDB.

- **Session pointer + epoch complexity**
  - Keep monotonic `device_sync_cursor` and `updated_at` conflict policy.
  - Avoid over-engineering unless multi-provider complexity emerges.

- **Feature-wide snapshot/undo semantics**
  - Replace global undo model with event-level correction flows for logs (edit/delete set, restore session draft).

## C. Patterns unnecessary for fitness SaaS

- Filesystem directory-handle workflows.
- Multi-provider file export/import abstractions as primary persistence.
- Heavy canvas/editor-specific layering and interaction architecture.

---

## 3) Data Modeling Standards

- Use snake_case in DB, camelCase in app DTOs.
- Every mutable domain row includes:
  - `id (uuid)`, `user_id`, `created_at`, `updated_at`.
- Prefer append-friendly tables for activity histories (`set_logs`, `pr_events`) over repeatedly mutating aggregates.
- Derived aggregates (weekly volume, progression scores) live in materialized views or scheduled rollups.
- Soft-delete where audit value matters (`deleted_at`), especially for logs and plans.

---

## 4) Auth & Security Doctrine (Supabase)

- Supabase Auth user id is authoritative identity key.
- All user-owned tables have strict `user_id = auth.uid()` RLS rules.
- Coach/client sharing requires explicit membership/link tables with role-scoped policies.
- Service-role jobs are limited to background analytics rollups and recommendation generation.
- Never trust role from client payloads; role membership is validated in DB policy conditions.

---

## 5) Offline & Sync Doctrine

- Local-first write path:
  1. Write to IndexedDB queue + local cache.
  2. Optimistically update UI.
  3. Flush queue to Supabase when online.
- Include `device_id`, `client_mutation_id`, and timestamps on queued mutations for idempotency.
- Conflict baseline:
  - logs: last-write-wins with user-visible “updated from another device” banner.
  - plans/programming: server-version check + merge/review flow.
- Background sync via service worker periodic sync where available; fallback to app-resume sync.

---

## 6) New Required Patterns for Fawxzzy Domain

### Workout Logging
- Session-centric model: workout session -> exercises -> sets/reps/load/RPE.
- Draft-resume pattern for interrupted workouts.
- Fast-entry UX contracts: one-thumb numeric input + offline-safe submit.

### PR Tracking
- Event table for PRs (`pr_events`) with typed categories (weight, reps, volume, estimated 1RM).
- Deterministic PR calculators and re-computation jobs from raw logs.

### Progressive Overload Generation
- Rule engine inputs:
  - recent compliance,
  - fatigue proxies,
  - performance trend,
  - target program constraints.
- Generate recommendations as explicit records (`overload_recommendations`) with status lifecycle (`proposed`, `accepted`, `ignored`).

### Analytics & Reporting
- Separate operational tables from analytics views.
- Weekly/monthly rollups for volume, adherence, PR cadence, and plateau detection.
- Track data-quality metrics (missing logs, outlier entries, stale plans).

### Mobile-first Performance
- App Router route-segment boundaries for code-splitting by workflow.
- Minimize hydration on log-entry screens.
- Aggressive caching strategy for static shell + stale-while-revalidate for summaries.
- Use virtualized lists for history screens.

---

## 7) Workflow Discipline

- PRs must state **what changed + why**, plus risk/rollback notes for data model changes.
- Any schema change requires:
  - migration,
  - RLS policy update check,
  - backfill/rollup impact note.
- Verification tiers:
  - fast: lint + unit + typecheck,
  - full: + integration (RLS/policy tests) + PWA offline sync tests.
- Changelog entries should describe user-facing and operational impact.

---

## 8) Guardrails

- Do not put business logic in React components.
- Do not ship new tables without RLS.
- Do not add analytics fields that are not tied to stable event semantics.
- Do not rely on online-only assumptions for critical workout logging flows.
- Prefer explicit, testable recommendation logic over opaque heuristics.
