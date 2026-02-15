# Architecture

## Storage Mode Switching (OPFS vs Folder)

### Problem Statement

The current `StorageManager` has to coordinate three concerns at once:

1. **Provider preference and capability fallback** (selected provider vs supported provider).
2. **Current project routing** (which provider owns a project ID and current directory handle).
3. **Snapshot lifecycle safety** (ensuring save/load/import/export always operate against a consistent, provider-owned snapshot).

This makes mode switching logic harder to reason about and spreads policy decisions across manager and provider implementations.

---

### Proposed Architecture

Introduce a small orchestration layer with explicit boundaries:

- `StorageModeOrchestrator` (new): resolves active mode, switching policy, and fallback messaging.
- `ProjectSessionRegistry` (new): owns current project identity and origin (`providerKey`, `projectId`, `locationKey`).
- `SnapshotTransactionService` (new): enforces atomic snapshot save/load semantics and migration-safe mode transitions.
- Providers (`FolderProvider`, `OPFSProvider`, `IndexedDBProvider`): remain focused on filesystem/DB IO only.

This keeps provider implementations modular and moves switching policy out of provider IO paths.

---

### Module Responsibilities

#### 1) `StorageModeOrchestrator`

**Owns:**
- Preferred mode (`folder` | `opfs` | `indexeddb`) from persisted user settings.
- Runtime capability checks.
- Active mode selection and fallback policy.
- Switch intents (`setActiveProvider`, `changeFolderLocation`) with explicit outcomes.

**Returns a rich result shape:**
- `activeMode`
- `preferredMode`
- `fallbackReason` (`unsupported`, `permission-lost`, `not-configured`, etc.)
- `requiresUserAction` (boolean + action id)

This replaces ad-hoc checks in `StorageManager.getActiveProviderStatus()` and gives UI a single source of truth.

#### 2) `ProjectSessionRegistry`

**Owns:**
- Current project pointer as a typed value:
  - `providerKey`
  - `projectId`
  - `locationKey` (folder name, OPFS key, etc.)
  - `epoch` (monotonic counter incremented on provider switch/load/import)

**Rules:**
- Session pointer is never inferred from raw directory handles.
- `epoch` invalidates stale async operations that started before a switch.

This avoids subtle cross-provider ambiguity (for example, when folder handle exists but selected mode is OPFS).

#### 3) `SnapshotTransactionService`

**Owns:**
- Pre-save snapshot normalization and validation.
- Write-ahead temp output + commit/replace (best effort for each backend).
- Post-write metadata update only after snapshot commit succeeds.
- Safe load/import with schema version checks and migration hooks.

**Safety contract:**
- Every mutation runs as `begin -> write temp -> validate -> commit -> publish session`.
- Failed commits never advance `ProjectSessionRegistry`.

This guarantees snapshot safety during normal saves and during mode switches.

#### 4) Providers

Providers should expose only backend primitives:
- `prepareLocation(...)`
- `writeSnapshot(...)`
- `readSnapshot(...)`
- `listSnapshots(...)`
- `deleteSnapshot(...)`

They should not decide mode switching, fallback policy, or session ownership.

---

### Storage Mode Switching Flow

#### A. User switches preferred mode

1. UI sends `switchMode(targetMode)` to `StorageModeOrchestrator`.
2. Orchestrator validates support + prerequisites (folder permission, OPFS availability).
3. If switch is possible, it updates preference and returns `activeMode`.
4. `ProjectSessionRegistry` keeps existing project reference until next explicit load/save/import, or can be cleared by policy.

**Recommendation:** default to *sticky current project*; switching mode changes destination for *new* projects, not implicit migration.

#### B. Save after switching mode

1. Save command asks `ProjectSessionRegistry` for active project context.
2. If current project belongs to a different provider and save is “in-place”, route to that project owner.
3. If save is “save as new” or no current project, route to orchestrator `activeMode`.
4. `SnapshotTransactionService` commits atomically and then publishes updated session pointer.

This preserves user intent and prevents accidental cross-provider overwrite.

#### C. Optional explicit migration

Expose `migrateProject(projectId, toMode)` as an explicit command:
- Read snapshot from source provider.
- Write via transaction service to target provider as a new project.
- Link metadata (`sourceProjectId`, `migratedAt`).

Do not conflate migration with provider preference switching.

---

### Snapshot Safety Invariants

1. **Single writer per project session epoch.**
2. **No metadata pointer update before durable snapshot commit.**
3. **Provider ownership is explicit and immutable per project ID.**
4. **Mode switch cannot mutate existing snapshots implicitly.**
5. **Import/export use the same transaction boundary as save/load.**

---

### Suggested Type Contracts

```ts
export type ProviderKey = "folder" | "opfs" | "indexeddb";

export type SessionPointer = {
  providerKey: ProviderKey;
  projectId: string;
  locationKey: string;
  epoch: number;
};

export type ModeResolution = {
  preferredMode: ProviderKey;
  activeMode: ProviderKey;
  fallbackReason?: "unsupported" | "permission-lost" | "not-configured";
  requiresUserAction?: { action: "pick-folder" | "grant-permission" };
};

export interface SnapshotTransactionService {
  save(input: SaveCommand): Promise<CommitResult>;
  load(input: LoadCommand): Promise<SnapshotResult>;
  migrate(input: MigrateCommand): Promise<MigrateResult>;
}
```

---

### Incremental Migration Plan

1. Add `StorageModeOrchestrator` as a thin wrapper around existing `StorageManager` resolution logic.
2. Introduce `ProjectSessionRegistry` and move `currentProjectId` + directory-handle ownership into it.
3. Route `save/load/import/export` through `SnapshotTransactionService` while keeping provider code mostly unchanged.
4. Reduce providers to IO-focused primitives and remove policy branching from them.
5. Add invariants/tests for epoch invalidation and metadata-after-commit ordering.

This plan minimizes risk and preserves current user behavior while creating clear, testable boundaries.
