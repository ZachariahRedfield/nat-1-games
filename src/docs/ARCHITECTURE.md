# Architecture Overview


Nat-1 Games is implemented as a **modular monolith**. Each module owns its domain logic, state, and UI composition, and interacts with other modules only through explicit, approved boundaries.


## Core Principles
- Modules are isolated by default
- Shared logic lives only in `core/` or `shared/`
- UI components do not own business logic
- State mutations are centralized and traceable


## Module Map
<!-- AGENT:BEGIN module-map -->
- MapBuilder
- Grid, tiles, canvas layers, brushes
- Owns map state, history, undo/redo
- AssetManager
- Asset metadata, import/export, tagging
- SessionManager (planned)
- Multiplayer/session state
- Core
- Shared types, utilities, invariants
<!-- AGENT:END module-map -->


## High-Level Data Flow
<!-- AGENT:BEGIN data-flow -->
- User input → UI layer
- UI dispatches intent → domain/state layer
- State mutation recorded in history system
- Render layer reacts to state snapshot
<!-- AGENT:END data-flow -->


## Folder Structure (Simplified)
<!-- AGENT:BEGIN folder-structure -->
- /modules
- /map-builder
- /asset-manager
- /core
- /shared
- /docs
<!-- AGENT:END folder-structure -->
