# Nat-1 Codex


This document defines **source-of-truth concepts and invariants**. It is intentionally concise.


## Tool Modes
- Pan
- Stamp Brush (grid-based tiles)
- Canvas Brush (freeform overlays)


## State & History Invariants
- All state mutations must be reversible
- Undo/redo is snapshot-based
- No side effects during render

## Completion Criteria

After implementing a change, always satisfy the conditions in:

📌 `src/docs/CODEX_CHECKLIST.md`

Before claiming a fix is complete, Codex should verify each checklist item.



## Current Phase
<!-- AGENT:BEGIN current-phase -->
- Stabilizing MapBuilder save/load and storage providers
<!-- AGENT:END current-phase -->


## Done (This Phase)
<!-- AGENT:BEGIN done-list -->
- Added undo/redo for canvas + grid
- Modularized MapBuilder components
- Versioned save/load snapshots and stripped runtime-only asset fields
- Introduced StorageProvider architecture with OPFS/IndexedDB + pack export/import
- Added header menu storage status with pack import/export actions
- Implemented mobile/tablet UI refactor for shared header + MapBuilder layout
<!-- AGENT:END done-list -->


## Next Up
<!-- AGENT:BEGIN next-up -->
- Mobile UI validation + polish
<!-- AGENT:END next-up -->


## Known Issues
<!-- AGENT:BEGIN known-issues -->
- Canvas opacity stacking edge cases
- Pointer capture bugs when leaving grid
<!-- AGENT:END known-issues -->
