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

## Priority Tasks

- User Login (Phase 0)
  - Goal: add a lightweight authentication flow so features like Save/Load, favorites, and sessions are tied to a user.
  - MVP scope:
    - UI: Login/Register modal (email + password), Logout action.
    - Session: store auth token in memory + localStorage for persistence; auto‑restore on app start.
    - Guards: gate Save/Load and session features behind an authenticated state; graceful prompts when unauthenticated.
    - Stubbed auth service interface so we can plug in a real backend later; include mock adapter for local dev.
  - Next steps:
    - Roles: GM vs Player flags for Session Manager.
    - Profile: display name/avatar; basic settings.
    - Providers: optional OAuth (Google/GitHub) once backend exists.

### 💬 Codex Instruction — User Login System Setup

Implement a basic User Login System for the Nat‑1 Games app.

Goal

- Add username + password login with Player/DM role selection.

Requirements

- Login UI asks for:
  - Username (string)
  - Password (string)
  - Role (dropdown/toggle: "Player" | "DM")
- On submit:
  - Verify credentials via `/api/login` (serverless function).
  - If user is missing, allow signup via `/api/signup`.
  - On success, store `{ username, role, token }` in `localStorage` (e.g., key `auth.session`).
- Post‑login routing:
  - If role === "DM", load Map Builder / DM Menu.
  - If role === "Player", load a placeholder screen ("Player View Coming Soon").
- Protect DM routes (Map Builder, DM Menu) so they require a valid login token.
- On app load, auto‑restore session from `localStorage` and redirect appropriately.

Backend Implementation (Supabase)

- Use Supabase for storage and verification (no custom serverless needed for MVP).
- Env vars (client via Vite):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Table: `users`
  - Columns: `id (uuid, default gen_random_uuid())`, `username (text, unique, lowercase)`, `password_hash (text)`, `role (text: 'Player'|'DM')`, `created_at (timestamptz default now())`
- RLS policies:
  - Enable RLS.
  - Allow `select` on `users` for row where `username = lower(current_setting('request.jwt.claims', true)::json->>'sub')` OR temporarily allow `select` by anyone for login purposes (MVP). Harden later.
  - Allow `insert` for anyone (MVP). Harden later.
- Client lib: `@supabase/supabase-js` (see `src/utils/supabaseClient.js`).

KV Schema

- Key: `user:{username}` → value:
  - `{ username, role, passwordHash, createdAt, updatedAt }`
- Uniqueness: `username` is unique (case‑insensitive; store a normalized copy as key)

API Contracts

- Not required for MVP (client talks directly to Supabase). Keep response handling uniform in UI code.

JWT

- Not used for MVP. Session data is `{ username, role }` stored in localStorage. Consider switching to Supabase Auth later.

Client Behavior

- On app init:
  - The Login screen is the first view if no prior session exists (recently logged in behavior).
  - Check `localStorage.getItem('auth.session')`; if present and token not expired, auto‑route to the role‑appropriate screen.
- Login flow:
  - POST `/api/login`
  - On success, persist `{ username, role, token }` under `auth.session`
  - Route: DM → Map Builder; Player → Player placeholder
- Signup flow:
  - POST `/api/signup`
  - Does not auto‑login; returns the user to the Login screen with a notice to log in.
  - At Login, the user selects desired role (Player/DM) for the session route.
- Logout:
  - Clear `auth.session`; return to Main Menu (unauth state)

Route Protection (DM‑only)

- Guard DM components/screens (Map Builder, future DM Menu):
  - If no session or role !== "DM" → redirect to Login screen (or Main Menu with prompt)
  - Optionally, validate token with a lightweight `/api/verify` later

Security Notes

- Never store plaintext passwords; always hash via bcrypt on the server.
- Use HTTPS; protect JWT secret.
- Rate‑limit login/signup (Vercel middleware or function‑local)
- Consider CSRF/XSS mitigations; use `SameSite=Lax` if switching to cookies later.

Client Stubs (implemented)

- `auth.js` client module:
  - `login(username, password)` → Supabase select + bcrypt compare
  - `signup(username, password, role)` → Supabase insert with bcrypt hash
  - `getSession()` / `setSession()` / `clearSession()`
  - `isDM()` helper
- New screens:
  - `Login.jsx` with username, password, role input + submit; link to sign up
  - `PlayerPlaceholder.jsx` ("Player View Coming Soon")

Acceptance Criteria

- Can sign up a new user and receive a token
- Can log in with existing user; token stored in `localStorage`
- DM is routed to Map Builder; Player to placeholder
- DM routes are blocked when unauthenticated or role !== DM
- Refresh persists session and routing

Future Expansion

- Password reset flow (email/OTP)
- Profile management (display name, avatar)
- Social login (Google/GitHub) via OAuth

Supabase Setup (where to configure)

- Create a Supabase project; note the Project URL and anon key.
- Create `users` table with columns:
  - `id uuid primary key default gen_random_uuid()` (or `uuid_generate_v4()`)
  - `username text unique not null` (store lowercase)
  - `password_hash text not null`
  - `role text not null check (role in ('Player','DM'))`
  - `created_at timestamptz default now()`
- Enable RLS. For MVP, add permissive policies:
  - Allow `select` on all rows (temporary for login) — tighten later to RPC-based login or policy-based lookup.
  - Allow `insert` on all rows (temporary for signup) — add captcha/rate-limits and ownership later.
- In the frontend `.env`, add:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
- The app reads these via `src/utils/supabaseClient.js`.

Profiles table (Auth-based)

- Use Supabase Auth for password hashing and sessions; store display info in `profiles`:
  - Table `profiles` columns:
    - `id uuid primary key references auth.users(id) on delete cascade`
    - `username text unique not null`
    - `role text not null check (role in ('Player','DM'))`
    - `created_at timestamptz default now()`
- Enable RLS and add policies so users can access only their own row:

```sql
alter table profiles enable row level security;

create policy "Profiles selectable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles updatable by owner"
  on profiles for update
  using (auth.uid() = id);

create policy "Profiles insert by owner"
  on profiles for insert
  with check (auth.uid() = id);
```


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
* Save Selection dialog: Added a right-side panel (reusing Asset Creation layout) that lets you choose Natural Group or Merged Image for images, or Token/Token Group for tokens. Replaces browser confirm/prompt flow.
* Assets panel layout: In Images preview mode, add a divider between thumbnail and name and move Edit/Delete below the name. In Names mode, keep Delete at top-right and place Edit beside it.
* Asset action buttons: Normalized Edit/Delete sizes and grouped them so they touch (no gap) in both modes for a consistent look.
* Asset tile padding: In Images preview mode, increased bottom padding and used a vertical layout so the selection border encloses the Edit/Delete buttons cleanly.
* App default route: Removed the development shortcut that booted directly into Map Builder; the app now opens to the Main Menu by default.
* Asset editing: Added an Edit button next to Delete on selected assets. Clicking Edit re-opens the Asset Creation panel prefilled with the asset. Save overwrites; Save Copy creates a new asset.
* Auth scaffolding: Added `Login.jsx`, `PlayerPlaceholder.jsx`, and `src/utils/auth.js`; guarded DM routes in `src/App.jsx`. Added serverless API stubs `api/login.js` and `api/signup.js` using bcrypt, JWT, and Vercel KV. Session stored in `localStorage` and auto-restored on load.
* Auth UI polish: Added Logout button and current username/role to the top-right of headers (Map Builder, Start Session, Asset Creation, Player). Clicking Logout clears the session and returns to the Main Menu/Login.

### How To Test — Multi-Select & Save

* Select mode: Click to select one. Shift/Ctrl-click toggles additional items.
* Drag-box: In Select mode, click-and-drag on empty space to marquee-select.
* Save (images): With multiple images selected, press Save and choose Natural Group or Merged Image in the dialog.
* Save (tokens): With multiple tokens selected, press Save and confirm Token Group in the dialog.
* Mixed: When both types selected, use the dialog’s Images/Tokens toggle to pick a path; the other type is ignored for this save.
* Edit asset: Select an asset in the Assets panel, click Edit. Modify fields and press Save (overwrite) or Save Copy (duplicate). Text/label images open in the Text tab; Color opens in Materials; Natural shows the variants list.
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

#### Save Selection Dialog (Unified with Asset Creator)

- Layout: Reuse the Asset Creation panel shell and controls. Open as a right-side panel (same width/spacing), prefilled from current selection. Disable or hide sections that do not apply to the selection.
- Target kinds and availability depend on selection:
  - Single Image/Natural instance: default target = Image; allow Merged Image (same result for single), and allow Natural (single-variant) if desired.
  - Multiple Image/Natural instances: show a segmented toggle: Natural Group | Merged Image. Natural Group builds variants from each selected item; Merged Image rasterizes into one bitmap.
  - Single Token: target = Token (locked). Prefill glow/name/size/opacity from instance; engine defaults to grid.
  - Multiple Tokens: target = Token Group (locked). Show ordered member list; default order is left-to-right then top-to-bottom.
  - Mixed Images + Tokens: show an inline warning with two action buttons: “Images only” or “Tokens only”. Clicking one filters the selection in-session and updates the dialog accordingly.
- Common fields (top):
  - Name input (prefilled with a sensible default).
  - Preview (thumbnail or tight bounding box preview if Merged Image is selected).
  - Save / Cancel actions; Enter submits, Esc cancels.
- Image target options (when applicable):
  - Bake transforms: rotation/flip/opacity baked into output (default on for selection saves).
  - Size (tiles) default from selected instance footprint; editable before saving.
  - Transparency background toggle (on for raster exports).
- Natural Group options:
  - Variants list (grid): show each contributing source; allow remove/reorder before save.
  - Randomization defaults: randomRotation, randomVariant, randomFlipX/Y, randomSize[min,max], randomOpacity[min,max].
- Merged Image options:
  - Bounds: auto-tight (default) or fixed grid-aligned bounding box.
  - Include layer order note: uses selection z-order as drawn (top-most last). Opacity/flip/rotation are baked.
- Token target options:
  - Name, HP, Initiative, Glow color, Size (tiles), Opacity; all prefilled from the selected token.
- Token Group options:
  - Member list with order and remove; spawn spacing (tiles, default 0); default engine grid, no drawing engines.
- Validation & UX:
  - Save disabled until a valid name and at least one variant/member (where applicable).
  - Mixed-type selections show the filter choice UI; saving enforces a single-target type.
  - On success, push a single undo ‘bundle’ capturing the new asset and any selection-side effects, then switch the selected asset to the new one.

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

