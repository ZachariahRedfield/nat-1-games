🎲 Nat-1 Games – Core Developer Codex

(Map Builder + Session Manager Systems)

This Codex defines the shared architecture, active roadmap, and current development state for the Nat-1 Games platform — unifying the Map Builder and future Session Manager under a consistent system.

🧭 High-Level Architecture

Core Modules

Map Builder: interactive world editor with grid & canvas layers, object placement, and asset management.

Session Manager: live tabletop interface with tokens, initiative, lighting, and player views.

Asset System: handles all visual/game data (images, tokens, naturals, materials, labels).

Auth System: user sessions with Player/DM roles and persistent saves.

Persistence Layer: JSON-based project save/load + Supabase backend for optional cloud sync.

State Management

React hooks (temporary) → migrating to Zustand/Reducer store for performance & undo bundles.

History stack covers grid, canvas, tokens, and object edits.

Tool Modes

Pan / Select / Draw / Erase / Zoom — unified cursor logic.

Stamp Brush (grid) and Canvas Brush (freeform) both respect size, opacity, color, and eraser state.

Layers: Background / Base / Sky / Tokens with visibility & lock toggles.

🗺️ Roadmap Overview
Phase 1 – Persistence & UX Polish (current)

✅ Save/Load projects to JSON (maps, objects, tokens, assets).

✅ Undo/Redo for tiles, canvas, and object placement.

✅ Asset creation & editing (images, naturals, tokens, groups).

✅ Keyboard shortcuts & smoother canvas brush.

🔜 Asset thumbnails, favorites, drag-drop import, PNG export.

🔜 Modularize builder logic into smaller hooks.

Phase 2 – Token System & Session Prep

Token Inspector (name / HP / init / glow / size).

Initiative tracker + sorting.

TokenGroup assets (spawn aligned sets).

Sub-tile movement and path preview.

Phase 3 – Lighting & Vision

Fog of War + per-token FOV.

Light sources with radius/falloff.

Weather/effect layers (rain, fog, fire, snow).

Phase 4 – Asset Metadata & Discovery

Tags, search/filter, authors, favorites.

Missing-asset handling & migration tools.

Phase 5 – Architecture & Quality

Migrate to Zustand store + selectors.

Begin TypeScript conversion.

CI lint/format/tests for utils & reducers.

Optional plugin system (custom brushes/effects).

🔐 User Login System (Phase 0 – Complete MVP)

Purpose: Tie saves, favorites, and sessions to authenticated users.
Stack: Supabase + @supabase/supabase-js client.

Behavior

Login/Register modal → stores { username, role, token } in localStorage.

Roles: "Player" | "DM".

Auto-restore session on load.

DM routes (Map Builder, DM Menu) guarded; Player routes show placeholder.

Logout clears session.

Next: add profile data (display name/avatar), password reset, OAuth.

🧱 Current Feature Summary

✅ Map Builder

Smooth coalesced Canvas Brush (spacing / opacity / erase).

Layered Grid system with visibility & lock.

Select + Multi-Select + Group Save (Natural / Merged / Token Group).

Unified Interaction Toolbar (Draw, Erase, Grid/Canvas, Select, Save, Zoom).

Undo/Redo + History snapshot system.

Asset Creation & Editing panel with Favorites.

Token HUD: toggle HP + Initiative display.

NumericInput component for consistent controls.

✅ Auth Integration

Login.jsx, PlayerPlaceholder.jsx, and auth.js.

Session persistence + header display (username/role + Logout).

✅ UX/UI Polish

Icons + tooltips for all tools.

Cursor states reflect modes.

Consistent edit/delete/favorite UI in Asset panels.

Default startup: Main Menu → Login → Map Builder (DM).

🧩 Multi-Select & Group Save (Design Spec)

Select Mode: click, Shift/Ctrl multi-select, drag-box marquee.

Images only: save as Natural Group (variants) or Merged Image (composite).

Tokens only: save as Token Group (ordered list).

Mixed: choose Images or Tokens path.

Dialog: right-panel reuse of Asset Creator with preview, name, and type options.

Data:

{ id, name, kind:'tokenGroup', members:[{ assetId }], defaultEngine:'grid' }


Undo: grouped bundle on save.

🧠 Session Manager (Upcoming)

Token HUD Initiative display + turn indicators.

Sub-tile movement (½ / ¼ tile).

Waypoint path preview.

Sync with DM-hosted session via Supabase or local P2P.

⚙️ Backlog / Technical Goals

Replace React state with centralized store.

TypeScript + JSDoc standardization.

CI/CD validation and auto-formatting.

Optional plugin/extension registry (custom brushes, UI themes).

🪶 Known Issues

None critical. All prior canvas, token, and layer bugs resolved.