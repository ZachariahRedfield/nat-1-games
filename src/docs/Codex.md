# Nat-1 Games Codex

This codex tracks cross-project concepts, roadmap items, and running ideas that span Map Builder and the future Session Manager.

## ⏭️ Suggested Roadmap

### Phase 1 – Persistence + UX Polish

- Project save/load to JSON (maps, objects, tokens, assets, favorites); import/export.
- Asset store persistence and thumbnails; drag-drop image import; dedupe by hash/name.
- Map export: PNG (with/without grid, per-layer toggles).
- Keyboard shortcuts: B/E (brush/eraser), 1–3 layers, Z/Y (undo/redo), Del (delete), Esc (clear selection).
- Fix small state issues in Map Builder and refactor heavy logic into smaller hooks/modules.

### Phase 2 – Token System & Session Prep

- Token inspector panel: name, HP, initiative, glow, size; batch edit when multi-selected.
- Initiative tracker: simple turn order list; sort by initiative; quick edit.
- TokenGroup asset: save multi-selection into a group; stamp spawns individuals aligned side-by-side.
- Sub-tile movement & snap-to-waypoints; path preview.

### Phase 3 – Lighting, Vision, Effects

- Fog of War canvas with per-token FOV; wall segments block vision; GM reveal tools.
- Light sources with radius/falloff; layer blend modes for weather/effects (rain, fog, fire, snow).
- Evaluate PixiJS for batching/performance or remove if unnecessary.

### Phase 4 – Asset Metadata & Discovery

- Tags, folders, authors, search/filter, favorites.
- Handle missing assets; migration tools for inline dataURLs.

### Phase 5 – Architecture & Quality

- Move Map Builder state into reducer/Zustand store.
- Add selectors for performance.
- Begin TypeScript migration.
- Add CI lint/format + unit tests (utils, selection, undo reducers).
- Optional: plugin system for brushes/effects; export presets.

## Updates (Current)

* Token HUD initiative: Added a toggle to show initiative in the Token HUD; when enabled, tokens display "Init N" alongside HP.
* Cursor hints: Grid draw mode uses a "cell" cursor; canvas eraser shows a dashed red brush ring for clear feedback.
* Token HUD toggle: Added in Token settings panel. When enabled, tokens render a small overlay with name and HP.
* Text/Label assets: Added a creation menu under Image assets. Labels are currently treated like Image assets and can be stamped or brushed like images.
* UI polish: Moved "Save Selection" next to "Select" under Interaction, grouped both inside a subtle bordered container for clearer coupling. Removed the header "Save Selection" to reduce clutter.
* Save button label: Renamed "Save Selection" to "Save" next to the Select button (functionality unchanged; prompts for name and switches to the new asset as before).
* Save supports tokens and naturals: When a token is selected, Save creates a new Token asset from the current token (including rotation/flip/opacity and glow as default). When a Natural-stamped image is selected, Save creates a new Image asset based on that variant and switches the asset group to Images for visibility.
* Interaction layout (single group): Consolidated Draw, Grid/Canvas, Select, and Save into one horizontal group with a single background container. When Draw is active, Grid/Canvas appear between Draw and Select; when Select is active, Save appears to the right of Select.
* Header polish: Moved the Toolbar toggle under the "Map Builder" title as a compact, low-emphasis button; removed it from the right-side header controls.
* Layer icons: Replaced placeholder/emoji eyes with inline SVG icons for reliable rendering; added a Tokens layer visibility toggle using the same icons.
* Select-mode crash fix: Resolved a white screen when pressing Select caused by an undefined `selectedTokensList` reference. Added missing state to MapBuilder and guarded usages.

### How To Test — Multi-Select & Save

* Select mode: Click to select one. Shift/Ctrl-click toggles additional items.
* Drag-box: In Select mode, click-and-drag on empty space to marquee-select.
* Save (images): With multiple images selected, press Save → confirm dialog asks Natural Group (OK) or Merged Image (Cancel).
* Save (tokens): With multiple tokens selected, press Save → creates a Token Group asset.
* Mixed: When both types selected, choose which to save by reducing the selection to one type (current behavior).
* Assets panel preview toggle: Renamed the toggle to "Preview Image" / "Preview Names". When "Preview Names" is active, the Assets box renders a compact vertical list of asset names instead of image thumbnails.
* Assets panel preview mode: Replaced single toggle with a side-by-side segmented control in the Assets header: "Images" | "Names". Selecting "Names" renders a compact vertical list; selecting "Images" shows thumbnail grid.

  * Names view refined to slimmer rows that fit the full name (no truncation), wrapping as needed for long names.
* Token name input fix: Synchronized selected token object with token store updates so typing does not reset/blur between keys.
* Asset Creator input focus: Avoided remounting the inner form by switching from a nested component (<Section />) to a plain render function, preventing the name input from losing focus each keystroke.
* Default screen: Temporarily boot directly into Map Builder for faster UI iteration (App.jsx). Revert to Main Menu later.
* Multi-select & Save: Shift/Ctrl-click toggles multiple selections; drag-box marquee supported. Save creates Natural group or Merged image for images; creates Token Group for multiple tokens; Save supports single token/image as before.
* Startup defaults: Removed the default "Light Grey" color asset. Map Builder now starts with Draw + Grid selected.
* Multi-select keys: Ctrl/Command-click and Shift-click both toggle selections.
* Settings lock on multi-select: When multiple items are selected, per-item settings are locked. Save as a group to edit via parent/group settings later.
* Save button enablement: Save enables when any objects or tokens are selected (single or multi). It supports single image/token, multi-images (Natural Group or Merged), and multi-tokens (Token Group).
* Engine selection: Grid/Canvas buttons are always available in Draw mode for non-token groups, even when no asset is selected. Canvas painting uses the current brush color when no image asset is selected.
* Numeric inputs (project-wide): Introduced a common `NumericInput` component that allows free typing (including empty while editing), clamps to limits on commit (blur/Enter), and supports ArrowUp/ArrowDown to change by step (Shift multiplies by 10). Replaced existing `type="number"` fields in Map Builder, Brush Settings, and Asset Creator.
* Asset favorites: Added per-asset favorite toggle (star) and an "★ Favorites" filter in the Assets header. Favorites persist in project save/load and apply to both grid and list views.

## Backlog Notes (Mapped to Phases)

- Lighting/Vision Layer — see Suggested Roadmap Phase 3.
- Text/Label Layer — see Suggested Roadmap Phase 1 (UX polish).
- Smart Brush System — see Suggested Roadmap Phase 1.
- Effects/Weather Layer — see Suggested Roadmap Phase 3.
- Asset Metadata System — see Suggested Roadmap Phase 4.
- Interaction Improvements — see Suggested Roadmap Phase 1.

Note: The following “Design Spec – Multi-Select & Group Save” applies to Suggested Roadmap Phase 2.

### Design Spec — Multi-Select & Group Save

* **Selection model**

  * Mode: Available in Select mode. Click selects one; Shift/Ctrl toggles items. Drag to draw a marquee (drag-box) that selects all visible objects on the current layer and any visible tokens.
  * Mixed types: Allowed for editing, but Save flow requires choosing an image-only or token-only path if both are present.
  * UX: Esc clears selection; Delete removes selected; outline and count badge show selection state.

* **Save behavior by selection type**

  * *Images only (Image or Natural instances):*

    * Save as Natural Group: Each selection contributes one variant using its source (image src or the Natural variant src). Creates a new `natural` asset with variants; uses Natural settings (random rotation/size/variant).
    * Save as Merged Image: Composites all selected into a single bitmap using their transforms into a tight bounding box; saves as an `image` asset.
    * Prompt: Offer a choice between Natural Group vs Merged Image, plus name input.
  * *Tokens only:*

    * Save as Token Group: Creates a new `tokenGroup` asset (new kind) that stores an ordered list of member token assets. When placed, it spawns individual tokens side-by-side (no gap) as independent instances referencing their original assets.
    * Name prompt; default engine `grid`; allowedEngines `[ ]` (stamping only).
  * *Mixed images + tokens:*

    * Prompt to choose a path: “Images only” (ignores tokens) or “Tokens only” (ignores images). Inform that mixed save is not supported in one asset.

* **Placement semantics**

  * Natural Group: Stamps like other Naturals; random variant or first variant if randomization disabled.
  * Token Group: On stamp, spawns N tokens offset horizontally from the cursor center; each token is a normal token thereafter.

* **Data model**

  * `tokenGroup` asset: `{ id, name, kind:'tokenGroup', members:[{ assetId }...], defaultEngine:'grid', allowedEngines:[] }`.
  * Persistence: Include `tokenGroup` in save/load; strip transient runtime fields as with other assets.

* **Undo/redo**

  * Saving a group pushes a bundle entry capturing assets and affected layer objects/tokens for reversal.

* **Cursors & hints**

  * Drag-box cursor; count badge; hover highlights; status line shows selection count and type mix.

* **Constraints/notes**

  * Group save respects current transforms (rotation/flip/opacity/size). For Merged Image, the composite rasterizes these transforms; for Group assets, transforms are not baked into the asset, only the spawned instances.
  * Tokens respect token HUD visibility/toggles; HUD not baked into saved assets.

* **Grid Adjacency Heuristics**

  * Advanced alignment for walls/corners/T-junctions/caps.

* **Token Layer (Next)**

  * Token HUD polish; optional initiative display in HUD.
  * Multi-select; snap-to-waypoints.

* **Canvas Brush (Next)**

  * Expose smoothing strength (done); refine stroke coalescing.

## Session Manager – Running Ideas (Later)

* **Initiative display**

  * Track and show initiative in the token HUD during sessions.
  * Sorting/turn indicators and quick edit.

* **Sub-tile movement**

  * Allow tokens to move on a finer grid (e.g., half or quarter tiles) while preserving tile snapping option.
  * Visual hints and waypoints for smoother movement.

## Notes

* This document supersedes the previous MapBuilderCodex.md; consolidating under a project-wide Codex keeps design notes centralized as features span multiple areas (builder, session, assets).

## Known Issues (as of now)

* No active issues; previous tokens/layers items fixed. See Updates (Current) for details.

* **Select button broken** — current implementation not switching to/selecting items as expected.
* **Layer icons** — eye icons showing as `??`; replace with proper icons (e.g., Unicode 👁/🚫 or an icon set) and ensure font support.
