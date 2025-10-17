# Nat-1 Games Codex

This codex tracks cross-project concepts, roadmap items, and running ideas that span Map Builder and the future Session Manager.

## Updates (Current)


- Token HUD initiative: Added a toggle to show initiative in the Token HUD; when enabled, tokens display "Init N" alongside HP.
- Cursor hints: Grid draw mode uses a "cell" cursor; canvas eraser shows a dashed red brush ring for clear feedback.
- Token HUD toggle: Added in Token settings panel. When enabled, tokens render a small overlay with name and HP.
- Text/Label assets: Added a creation menu under Image assets. Labels are currently treated like Image assets and can be stamped or brushed like images.
- UI polish: Moved "Save Selection" next to "Select" under Interaction, grouped both inside a subtle bordered container for clearer coupling. Removed the header "Save Selection" to reduce clutter.
- Save button label: Renamed "Save Selection" to "Save" next to the Select button (functionality unchanged; prompts for name and switches to the new asset as before).
- Save supports tokens and naturals: When a token is selected, Save creates a new Token asset from the current token (including rotation/flip/opacity and glow as default). When a Natural-stamped image is selected, Save creates a new Image asset based on that variant and switches the asset group to Images for visibility.
- Interaction layout (single group): Consolidated Draw, Grid/Canvas, Select, and Save into one horizontal group with a single background container. When Draw is active, Grid/Canvas appear between Draw and Select; when Select is active, Save appears to the right of Select.
- Header polish: Moved the Toolbar toggle under the "Map Builder" title as a compact, low-emphasis button; removed it from the right-side header controls.

### How To Test — Multi‑Select & Save

- Select mode: Click to select one. Shift/Ctrl-click toggles additional items.
- Drag-box: In Select mode, click-and-drag on empty space to marquee-select.
- Save (images): With multiple images selected, press Save → confirm dialog asks Natural Group (OK) or Merged Image (Cancel).
- Save (tokens): With multiple tokens selected, press Save → creates a Token Group asset.
- Mixed: When both types selected, choose which to save by reducing the selection to one type (current behavior).
- Assets panel preview toggle: Renamed the toggle to "Preview Image" / "Preview Names". When "Preview Names" is active, the Assets box renders a compact vertical list of asset names instead of image thumbnails.
- Assets panel preview mode: Replaced single toggle with a side-by-side segmented control in the Assets header: "Images" | "Names". Selecting "Names" renders a compact vertical list; selecting "Images" shows thumbnail grid.
  - Names view refined to slimmer rows that fit the full name (no truncation), wrapping as needed for long names.
- Token name input fix: Synchronized selected token object with token store updates so typing does not reset/blur between keys.
- Asset Creator input focus: Avoided remounting the inner form by switching from a nested component (<Section />) to a plain render function, preventing the name input from losing focus each keystroke.
 - Default screen: Temporarily boot directly into Map Builder for faster UI iteration (App.jsx). Revert to Main Menu later.
- Multi-select & Save: Shift/Ctrl-click toggles multiple selections; drag-box marquee supported. Save creates Natural group or Merged image for images; creates Token Group for multiple tokens; Save supports single token/image as before.
- Startup defaults: Removed the default "Light Grey" color asset. Map Builder now starts with Draw + Grid selected.
- Multi-select keys: Ctrl/Command-click and Shift-click both toggle selections.
- Settings lock on multi-select: When multiple items are selected, per-item settings are locked. Save as a group to edit via parent/group settings later.
 - Save button enablement: Save enables when any objects or tokens are selected (single or multi). It supports single image/token, multi-images (Natural Group or Merged), and multi-tokens (Token Group).
 - Engine selection: Grid/Canvas buttons are always available in Draw mode for non-token groups, even when no asset is selected. Canvas painting uses the current brush color when no image asset is selected.
- Numeric inputs (project-wide): Introduced a common `NumericInput` component that allows free typing (including empty while editing), clamps to limits on commit (blur/Enter), and supports ArrowUp/ArrowDown to change by step (Shift multiplies by 10). Replaced existing `type="number"` fields in Map Builder, Brush Settings, and Asset Creator.
 - Asset favorites: Added per-asset favorite toggle (star) and an "★ Favorites" filter in the Assets header. Favorites persist in project save/load and apply to both grid and list views.

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

### Design Spec — Multi‑Select & Group Save

- Selection model
  - Mode: Available in Select mode. Click selects one; Shift/Ctrl toggles items. Drag to draw a marquee (drag‑box) that selects all visible objects on the current layer and any visible tokens.
  - Mixed types: Allowed for editing, but Save flow requires choosing an image‑only or token‑only path if both are present.
  - UX: Esc clears selection; Delete removes selected; outline and count badge show selection state.

- Save behavior by selection type
  - Images only (Image or Natural instances):
    - Save as Natural Group: Each selection contributes one variant using its source (image src or the Natural variant src). Creates a new `natural` asset with variants; uses Natural settings (random rotation/size/variant).
    - Save as Merged Image: Composites all selected into a single bitmap using their transforms into a tight bounding box; saves as an `image` asset.
    - Prompt: Offer a choice between Natural Group vs Merged Image, plus name input.
  - Tokens only:
    - Save as Token Group: Creates a new `tokenGroup` asset (new kind) that stores an ordered list of member token assets. When placed, it spawns individual tokens side‑by‑side (no gap) as independent instances referencing their original assets.
    - Name prompt; default engine `grid`; allowedEngines `[ ]` (stamping only).
  - Mixed images + tokens:
    - Prompt to choose a path: “Images only” (ignores tokens) or “Tokens only” (ignores images). Inform that mixed save is not supported in one asset.

- Placement semantics
  - Natural Group: Stamps like other Naturals; random variant or first variant if randomization disabled.
  - Token Group: On stamp, spawns N tokens offset horizontally from the cursor center; each token is a normal token thereafter.

- Data model
  - `tokenGroup` asset: `{ id, name, kind:'tokenGroup', members:[{ assetId }...], defaultEngine:'grid', allowedEngines:[] }`.
  - Persistence: Include `tokenGroup` in save/load; strip transient runtime fields as with other assets.

- Undo/redo
  - Saving a group pushes a bundle entry capturing assets and affected layer objects/tokens for reversal.

- Cursors & hints
  - Drag‑box cursor; count badge; hover highlights; status line shows selection count and type mix.

- Constraints/notes
  - Group save respects current transforms (rotation/flip/opacity/size). For Merged Image, the composite rasterizes these transforms; for Group assets, transforms are not baked into the asset, only the spawned instances.
  - Tokens respect token HUD visibility/toggles; HUD not baked into saved assets.

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

---

## Map Builder Codex (Merged)

The following content is merged verbatim from `src/docs/MapBuilderCodex.md` to preserve existing design notes, conventions, and roadmap context for the Map Builder. Future edits should be made in this Codex.

```
[MERGED FROM MapBuilderCodex.md]
```

