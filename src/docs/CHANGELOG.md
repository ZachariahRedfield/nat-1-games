# Change Log


## 2026-02

- Added an architecture proposal for cleaner storage mode switching boundaries (OPFS vs Folder) with explicit snapshot transaction safety invariants.
- Consolidated MapBuilder overlay z-index usage for tool HUD/right assets panel and added regression unit coverage for toolbar tool-intent dispatch so pointer-hit-testing fixes remain stable.
- Fixed mobile-only MapBuilder Playwright specs to use `testInfo.project.name` skip guards so desktop projects no longer error on unsupported `test.skip` callback parameters.
- Added a Playwright E2E harness for MapBuilder repro flows (desktop+mobile projects, deterministic dev-auth startup, and stable `data-testid` selectors) to catch toolbar/compact-control interaction regressions earlier.
- Kept RightAssets panel visible while aligning its overlay layer below tool/debug controls so panel hit-testing no longer blocks those interactions.
- Restored RightAssets panel visibility by anchoring its non-interactive overlay container to the full viewport while keeping toolbar/Debug HUD interactions unobstructed.
- Fixed MapBuilder right assets panel hit-testing so only the visible panel surface captures input, restoring toolbar and DEV Debug HUD clickability on mobile/desktop.
- Added a focused BUG_REPORT documenting reproducible MapBuilder interaction regressions (overlay hit-testing and mobile viewport controls) to guide follow-up fixes.
- Added a development-only MapBuilder Debug HUD with URL/keyboard toggles, live interaction/storage diagnostics, and harness actions for save/load/export/cache reset to speed local debugging without affecting production builds.
- Made Main Menu role constraints visible by rendering DM-only actions as disabled buttons with explicit "DM only" labels for non-DM users, while keeping navigation-level DM guards unchanged.
- Added strictly gated DEV auth bootstrap via URL params so sandbox runs can auto-login as a DM session and jump directly to mapBuilder/startSession/assetCreation without changing production behavior.

## 2026-01


### Automated Entry
- Refactored documentation into ARCHITECTURE / CODEX / CHANGELOG structure
- Introduced agent-writable fenced blocks
- Established doc-sync policy and automation philosophy
- Versioned project snapshots and removed runtime-only asset fields from persisted state
- Refactored save/load to StorageProvider architecture with OPFS/IndexedDB and .nat1pack packs
- Added header storage status plus pack import/export actions in the user menu
- Added mobile/tablet layout adjustments for shared header and MapBuilder UI panels
- Added storage menu controls to switch providers and update folder-backed storage locations

### Updates
- Made logout await Supabase sign-out and still clear local session/navigation state on async auth failures to avoid stale authenticated UI.
- Added focused logout tests covering sign-out rejection handling and async ordering for local state reset.
- Fixed MapBuilder selection resizing, off-grid transform hit capture, and overlay layering for modals/toasts.
- Improved storage reliability for asset deletions, first-time saves, and import/export notifications.
- Introduced a stacked interaction tool menu to reduce toolbar footprint.
- Kept the interaction tool menu open while moving between the active icon and menu options.
- Added a brief hover-close delay so the interaction tool menu stays open during pointer travel.
- Stabilized mobile asset drawers by disabling resize/drag behaviors and clamping saved heights.
- Removed canvas brush halo artifacts, made the mobile tool stack expand upward, and grouped top chrome controls to prevent split drags.
- Disabled canvas image-stamp smoothing so transparent-edge interpolation no longer shows white fringes during brush painting.
- Removed the extra circular clip from image-stamp canvas brushing so stamp edges no longer show a white ring when crossing transparent pixels.
- Normalized auth role UX by showing role selection in both login and sign-up flows so client validation matches the signup service contract.
- Switched login session role resolution to server-authenticated `data.role` (fallback `Player`) and removed client-side profile role mutation during login so DM gating reflects trusted auth data.

