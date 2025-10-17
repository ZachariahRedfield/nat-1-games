# Nat-1 Games Codex

This codex tracks cross-project concepts, roadmap items, and running ideas that span Map Builder and the future Session Manager.

## Updates (Current)

- Token HUD toggle: Added in Token settings panel. When enabled, tokens render a small overlay with name and HP.
- Text/Label assets: Added a creation menu under Image assets. Labels are currently treated like Image assets and can be stamped or brushed like images.

## Roadmap / TODO (Next Up)

- Lighting/Vision Layer
  - Walls block vision; per-token FOV reveals fog on a canvas mask.
  - Configurable light radius; GM controls for fog reset/reveal.

- Text/Label Layer
  - Editable text boxes with font, color, size controls.
  - Visibility per role (GM/player).

- Smart Brush System
  - Tool gated to Smart-Brush-enabled assets only.
  - Randomized rotations/scales; grouped variants per theme.

- Effects/Weather Layer
  - Rain, fire, fog, snow; blend modes + opacity; animated cycles.

- Asset Metadata System
  - Tags, folders, favorites, author; thumbnails; search/filter.

- Interaction Improvements
  - Multi-select; drag-box selection; better cursor hints.

- Grid Adjacency Heuristics
  - Advanced alignment for walls/corners/T-junctions/caps.

- Token Layer (Next)
  - Token HUD polish; optional initiative display in HUD.
  - Multi-select; snap-to-waypoints.

- Canvas Brush (Next)
  - Expose smoothing strength (done); refine stroke coalescing.

## Session Manager – Running Ideas (Later)

- Initiative display
  - Track and show initiative in the token HUD during sessions.
  - Sorting/turn indicators and quick edit.

- Sub-tile movement
  - Allow tokens to move on a finer grid (e.g., half or quarter tiles) while preserving tile snapping option.
  - Visual hints and waypoints for smoother movement.

## Notes

- This document supersedes the previous MapBuilderCodex.md; consolidating under a project-wide Codex keeps design notes centralized as features span multiple areas (builder, session, assets).

