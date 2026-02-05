# Change Log


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
