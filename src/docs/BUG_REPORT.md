# Bug Report

## 2026-02-10 — MapBuilder exploratory run (`?repro=mapBuilder&debug=1`)

### Scope covered
- Desktop + mobile viewport checks
- Tool interaction attempts (Pan/Stamp/Eraser)
- Undo/redo controls
- Mobile bottom toolbar and compact top controls
- Debug HUD snapshot action attempts
- Save flow entry point checks

### Bug 1 — Right assets overlay intercepts pointer events across unrelated UI controls
- **Repro steps**
  1. Open `/?repro=mapBuilder&debug=1` in a mobile viewport (390x844).
  2. Dismiss the initial folder prompt with **Not Now**.
  3. Try clicking **Stamp** in the bottom toolbar.
- **Observed**
  - Click repeatedly times out; Playwright reports pointer interception by an element under `z-[10030]`.
- **Expected**
  - Toolbar tool buttons should be clickable and switch active tool.
- **Root cause hypothesis**
  - The right assets panel overlay layer (`z-[10030]`) hosts a full-height flex container that is still hit-testable where it should be pass-through, so interactions leak outside intended panel bounds.
- **Evidence (console/automation output)**
  - `Locator.click: Timeout ... <div class="flex flex-col h-full">…</div> from <div class="absolute inset-0 z-[10030] pointer-events-none">…</div> subtree intercepts pointer events`.
- **Snapshot diff**
  - Debug HUD `activeToolId` stayed `grid` before and after attempted **Stamp** click (`ACTIVE_BEFORE grid`, `ACTIVE_AFTER grid`), confirming the interaction did not apply.

### Bug 2 — Debug HUD action buttons are visible but not clickable
- **Repro steps**
  1. Open `/?repro=mapBuilder&debug=1`.
  2. Dismiss **Not Now** if shown.
  3. Click **Dump State Summary** in the Debug HUD.
- **Observed**
  - Click times out with interception from the same `z-[10030]` overlay subtree.
- **Expected**
  - Debug HUD actions should be actionable in DEV to capture state snapshots.
- **Root cause hypothesis**
  - Layering conflict: Debug HUD is mounted at `z-[10015]` while right assets container uses `z-[10030]`; visual stacking and hit-testing diverge for portions of the screen.
- **Evidence (console/automation output)**
  - `Locator.click: Timeout ... Dump State Summary ... <div class="flex flex-col h-full">…</div> ... z-[10030] ... intercepts pointer events`.
- **Snapshot diff**
  - Unable to generate `Dump State Summary` diff due blocked action (interaction itself is the bug).

### Bug 3 — Compact top controls render outside tappable viewport on mobile
- **Repro steps**
  1. Open `/?repro=mapBuilder&debug=1` in mobile viewport (390x844).
  2. Dismiss **Not Now**.
  3. Try tapping compact header buttons **Map** or **Layers**.
- **Observed**
  - Clicks fail with `element is outside of the viewport` despite controls being present in DOM.
- **Expected**
  - Compact header controls should remain inside viewport and tappable on mobile.
- **Root cause hypothesis**
  - Fixed top chrome + overlay positioning offsets are causing the compact controls to be laid out outside visible/tappable bounds in this viewport.
- **Evidence (console/automation output)**
  - `Locator.click: Timeout ... name=/^Map$/ ... element is outside of the viewport`.
- **Snapshot diff**
  - No state transition could be captured because control taps do not register.

### Notes on save/reload/import/export coverage
- Save action entry points were reached, but import/export and full save/reload assertions are constrained in this non-interactive environment due native file/folder picker flows.

### Manual regression checklist for follow-up fixes
1. On desktop + mobile, verify Pan/Stamp/Eraser can be toggled by pointer/touch.
2. Confirm Debug HUD buttons (Save/Load/Export/Clear Caches/Dump) are all clickable in DEV.
3. Verify compact **Map/Layers** controls are visible and tappable across common device widths.
4. Re-run undo/redo after drawing and ensure history updates in both layouts.
5. Re-test save/load/import/export after overlay and layering fixes.

## 2026-02-10 — BUG_REPORT rerun (environment-limited)

### Scope attempted
- Tried to boot the deterministic repro route at `/?repro=mapBuilder&debug=1`.
- Tried to install dependencies and start the local Vite dev server.

### Environment limitation
- `npm install` is blocked by registry policy in this environment (`403 Forbidden` for `@playwright/test`), so the repro app could not be started locally.
- Because the app never booted, no new UI interaction evidence could be gathered in this rerun.

### Result
- No additional defects were confirmed beyond the previously documented three MapBuilder interaction issues above.
- Existing findings remain the active bug inventory for follow-up.

### Highest-impact / lowest-risk issue to fix first
- **Right assets overlay intercepts pointer events across unrelated UI controls**.
- Why first: it blocks core tool switching and debug controls, and likely has a constrained root cause in layering/hit-testing boundaries.

### BUG_FIX handoff block
- **Issue title:** Right assets overlay intercepts pointer events across unrelated UI controls
- **Deterministic repro steps:**
  1. Open `/?repro=mapBuilder&debug=1` in mobile viewport (390x844).
  2. Dismiss folder prompt with **Not Now**.
  3. Tap **Stamp** (or any bottom toolbar tool button).
- **Most likely root cause:** right assets overlay container remains hit-testable outside intended panel surface, allowing its subtree to intercept pointer events over toolbar/debug controls.
- **Target files/modules (likely):**
  - MapBuilder right-side assets overlay/layout component(s).
  - Shared layering/z-index constants for MapBuilder overlays.
- **Suggested unit test targets:**
  - A pure layering/hit-testing guard helper (if present) that determines pass-through vs interactive regions.
  - A reducer/state-selector test confirming tool changes apply when UI dispatches toolbar intents (to protect against regressions once pointer interception is removed).
