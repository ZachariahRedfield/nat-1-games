# Map Builder Codex
Design reference for Nat-1 Game’s map building system.

---

## Contributor Prompt (Working Agreement)

Use this Codex as the single source of truth for features, terminology, and architecture decisions for the Map Builder system.

When working on this project:
- Add new features by following the Codex structure for layers, tools, and systems.
- Refactor/fix code while respecting statuses (✅ Implemented, 🔜 Next/Planned, 🧠 Concept) defined here.
- Explain or design systems using Codex terms (e.g., “Canvas Brush,” “Token Layer,” “Grid Snapping System,” etc.).
- Document any code changes here to keep the Codex current.

Priorities:
1) Maintain feature consistency with the Codex.
2) Write production‑quality, commented React + JS/TS.
3) Use consistent naming with the Codex.
4) If unsure, propose a Codex spec addition here before coding.

---

## Overview
Defines all map editor systems, tools, and layer types. Each section lists: purpose, core logic, and dev notes for implementation.

---

## Assets & Menus (Implemented)

- Asset Groups: `Image`, `Token`, `Materials` (Color assets live under Materials).
- Assets button: small popover to switch the active group. Contextual actions sit to its right:
  - Image: `Upload`
  - Token: `Add Token` (creation mini‑panel: name, glow color, upload/convert from selected Image)
  - Materials: `Add Color` (creation mini‑panel)
- Grid list filters to the active group only. “Delete Asset” is available for Image/Token (blocked if asset is in use).
- Interaction (Draw/Select): always visible.
- Engine (Grid/Canvas): visible for Image/Materials; hidden for Token.

Behavioral Rules:
- Selecting a Token asset forces Engine = `grid`.
- Token menu: Draw → click places a token (single placement per click). Select → select/drag tokens only.
- Image/Materials menu: Draw/erase according to Engine; Select → select/drag image objects only.

Z‑Order:
- Token Layer renders below the `sky` layer visuals, above base/background.

---

## Core Layers

### Tile / Stamp Layer
**Purpose:** Base terrain and static props snapped to grid.
**Core Features:**
- Snap to grid (toggleable)
- Rotation, scale, opacity, flip
- Undo/redo integration
**Status:** ✅ Implemented
**Next:** Advanced smart adjacency alignment (walls/corners/T/caps)

---

### Canvas Brush Layer
**Purpose:** Freeform paint effects (fog, blood, texture overlay).
**Core Features:**
- Adjustable size, opacity, spacing
- Erase toggle (uses `destination-out`)
- Layer blending
- Blend modes (`globalCompositeOperation`): `source-over`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`.
- Coalesced pointer smoothing (EMA)
**Status:** ✅ Implemented (blend modes added)
**Notes:** Multiply for shadows/grime; Screen/Overlay for light/fog; use lower opacity for natural effects.
**Next:** Expose smoothing strength; refine path coalescing

---

### Token Layer
**Purpose:** Movable characters or interactables.
**Core Features:**
- Grid placement (click‑to‑place when Token menu + Draw)
- Select / drag / rotate (only when Token menu + Select)
- Per‑instance metadata (name, HP, initiative) and glow color
- Per‑instance transforms (size tiles, rotation, flipX/Y, opacity)
**Status:** ✅ Implemented (basic)
**Implementation Notes:**
- Asset model: master token asset (`kind: "token"`) + independent token instances saved in the map (instances do not affect each other).
- Rendering: supports `kind: "image"` and `kind: "token"` sources; token glow via CSS drop‑shadows.
- Interaction gating: token selection only in Token menu; image‑object selection only in Image/Materials menu.
- Z‑Order: tokens render below the `sky` layer visuals; above base/background.
**Next:** Free‑move (sub‑tile) positions; token HUD; multi‑select; waypoint snapping.

---

### Lighting / Vision Layer
**Purpose:** Dynamic lighting + fog of war.
**Core Features:**
- Walls block vision
- Tokens reveal fog
- Adjustable light radius
**Status:** 🔜 Planned
**Tech Notes:** Use shadow masking or alpha blending on a canvas overlay.

---

### Text / Label Layer
**Purpose:** Room names and notes.
**Core Features:**
- Editable text boxes
- Font, color, size controls
- Visibility per role (GM/player)
**Status:** 🔜 Planned

---

## Smart Systems

### Smart Brush System
**Purpose:** Randomized asset variation during painting.
**Core Features:**
- Rotational + size variance
- Random pattern stamping
- Asset groups per theme
**Asset Requirement:**
- Multiple variants per group (e.g., `tree1.png, tree2.png, tree3.png`).
- Only assets explicitly marked as Smart Brush‑enabled may use this system (e.g., `kind: "smartBrush"` or `meta.isSmartBrush: true`).
**Status:** 🧠 Concept
**Notes:** UI/tooling must gate the Smart Brush to eligible assets only.

---

### Procedural Generation
**Purpose:** Generate rooms, dungeons, or terrain automatically.
**Core Features:**
- Room + hallway layout
- Auto‑fill tiles and walls
- Random seed option
**Status:** 🧠 Concept

---

### GM Trap Layer
**Purpose:** Hidden GM‑only layer for secrets, traps, triggers.
**Core Features:**
- Visibility toggle
- Logic triggers (on step → reveal trap)
- Link to events system
**Status:** 🔜 Planned

---

### Grid Snapping System
**Purpose:** Unified snapping logic for all layers.
**Core Features:**
- Global on/off toggle
- Snap strength / threshold
- Supports square, hex, iso grids
**Status:** ✅ Implemented (base + basic smart adjacency)
**Notes:** Square image stamps auto‑rotate to follow adjacent runs of the same asset (horizontal vs vertical). Smart adjacency toggle is hidden when Token menu is active.
**Next:** Advanced adjacency heuristics (walls/corners/T/caps)

---

## Visual & Effects

### Effects / Weather Layer
**Purpose:** Dynamic or ambient overlays.
**Core Features:**
- Rain, fire, fog, snow
- Blend modes + opacity
- Animated cycles
**Status:** 🧠 Concept

---

## Data Systems

### Asset Metadata System
**Purpose:** Organize and tag user assets.
**Core Features:**
- Tags, folders, favorites, author
- Thumbnails + cache info
- Search / filter
**Status:** 🔜 Planned

---

### Save / Load System
**Purpose:** Store project data locally or to cloud.
**Core Features:**
- JSON serialization
- Auto‑save + snapshots
- Version history
**Status:** ✅ Implemented (base + canvas persistence v4)
**Notes:**
- Per‑layer canvases serialized as PNG data URLs and restored on load.
- Tokens saved as a per‑instance list with per‑instance properties (transform, glow, meta).

---

## Editor Systems

### Scene & Layer Manager
**Purpose:** Manage visibility, lock, and order of layers.
**Core Features:**
- Show/hide all
- Lock editing
- Scene tabs
**Status:** ✅ Implemented

---

### Interaction & Input System
**Purpose:** Unify draw/select/pan input handling.
**Core Features:**
- Cursor changes per mode
- Space/MMB pan
- Context menu actions
**Status:** ✅ Implemented
**Next:** Improve multi‑select and drag‑box selection.

---

## Roadmap / TODO (Next Up)

- Lighting/Vision Layer
  - Walls block vision; per‑token FOV reveals fog on a canvas mask.
  - Configurable light radius; GM controls for fog reset/reveal.

- Text/Label Layer
  - Editable text boxes with font, color, size controls.
  - Visibility per role (GM/player).

- Smart Brush System
  - Tool gated to Smart‑Brush‑enabled assets only.
  - Randomized rotations/scales; grouped variants per theme.

- Effects/Weather Layer
  - Rain, fire, fog, snow; blend modes + opacity; animated cycles.

- Asset Metadata System
  - Tags, folders, favorites, author; thumbnails; search/filter.

- Interaction Improvements
  - Multi‑select; drag‑box selection; better cursor hints.

- Grid Adjacency Heuristics
  - Advanced alignment for walls/corners/T‑junctions/caps.

- Token Layer (Next)
  - Free‑move (sub‑tile) positions; token HUD; multi‑select.
  - Snap to waypoints; initiative tracking helpers.

- Canvas Brush (Next)
  - Expose smoothing strength; refine path coalescing.

