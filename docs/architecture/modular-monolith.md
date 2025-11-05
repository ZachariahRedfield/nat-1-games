# Modular Monolith Architecture for the Map Builder & VTT System

## 1. Architectural Goals
- Deliver a single deployable application that is internally organized into reusable feature modules.
- Keep feature code isolated so that new functionality can be added through extension instead of modification.
- Encourage high cohesion within modules and loose coupling between them by communicating through interfaces, events, and shared contracts.
- Support solo or small-team development with clear boundaries, predictable dependencies, and straightforward testing strategies.

## 2. High-Level Module Overview
| Module | Core Responsibilities | Key Interfaces Exposed | Depends On |
| --- | --- | --- | --- |
| **Authentication & Shell** | Sign-in/up, profile management, top-level navigation, dependency composition. | `IAuthService`, `IUserSession`, `IAppShell`. | Platform services (storage, HTTP), UI framework. |
| **Map Builder** | Authoring maps, managing layers and tools, persisting map drafts, exporting playable maps. | `IMapEditor`, `IMapDraft`, `IToolController`, `IMapPersistence`. | Asset Manager, Shared UI components, Event Bus. |
| **Asset Manager** | Cataloging, importing, and providing assets (tiles, tokens, effects, pins). | `IAssetManager`, `IAsset`, `IAssetRepository`, `IAssetCatalog`. | Storage service, image processing, optional CDN. |
| **Session Manager** | Running live sessions: initiative tracking, fog of war, measurements, chat/rolls, status effects. | `ISessionController`, `IEncounter`, `IFogService`, `IEventHub`. | Map runtime model, Asset Manager, Event Bus. |
| **Shared Services** | Cross-cutting services such as persistence, event hub, configuration, logging. | `IEventBus`, `ILogger`, `IConfig`, `IStorageProvider`. | Platform/infra dependencies only. |
| **Shared UI & Components** | Reusable UI primitives (panels, lists, dialogs), rendering helpers, theming. | Component exports per framework conventions. | Styling system, UI framework. |

## 3. Module Boundaries and Internal Structure

### 3.1 Authentication & Shell
- Acts as the composition root that wires module implementations into the app.
- Provides user/session context to downstream modules via dependency injection.
- Contains routing/navigation to switch between Map Builder, Asset Library, and Session screens.

```
/auth
  services/
    AuthService.ts
  state/
    userSessionStore.ts
  ui/
    LoginScreen.tsx
    ShellLayout.tsx
```

### 3.2 Map Builder Module
- **Editor Core**: orchestrates editing state, active tool, selection, and undo stack.
- **Layer Manager**: maintains ordered layer collections (`TerrainLayer`, `TokenLayer`, `AnnotationLayer`, `EffectLayer`). Provides `activateLayer`, `toggleVisibility`, `mutateLayer(mapDraft, mutation)` APIs.
- **Tool System**: all tools implement `ITool` (methods `onPointerDown`, `onPointerMove`, `onPointerUp`, `cancel`). Tools register themselves with `ToolRegistry`. Examples: `DrawTool`, `EraseTool`, `SelectTool`, `ShapeTool`, `FillTool`.
- **Map Data Model**: `MapDraft` aggregates immutable `MapSnapshot`s for undo/redo and exposes methods like `addAsset`, `drawPath`, `eraseArea`. External modules interact with maps through the `IMap`/`IMapEditor` interface.
- **Persistence Adapter**: wraps `IMapPersistence` to load/save maps. Implementation lives in Shared Services.
- **Integration**: uses `IAssetManager` for asset palettes, dispatches editor events (e.g., `MapUpdated`, `AssetPlaced`) via the Event Bus.

```
/map-builder
  application/
    MapEditorController.ts
    commands/
      PlaceAssetCommand.ts
      DrawCommand.ts
  domain/
    MapDraft.ts
    layers/
      BaseLayer.ts
      TerrainLayer.ts
      TokenLayer.ts
    tools/
      ToolRegistry.ts
      DrawTool.ts
  ui/
    EditorCanvas.tsx
    LayerPanel.tsx
    ToolPalette.tsx
```

### 3.3 Asset Manager Module
- **Asset Types**: each implements `IAsset` with metadata and rendering hooks. Use composition for optional features (e.g., `WithAnnotation`, `WithAnimation`).
- **Repositories**: `FileSystemAssetRepository`, `CloudAssetRepository`, etc., fulfilling `IAssetRepository`. Switching storage is a composition change, not a module change.
- **Catalog & Search**: `AssetCatalogService` indexes assets for filtering/tagging. Exposes `search(query, filters)` returning typed results.
- **Import Pipeline**: `AssetImportService` validates files, generates thumbnails, writes data via repository, and publishes `AssetImported` event.
- **Runtime Cache**: `AssetCache` keeps frequently used assets in memory; invalidated by repository events.

```
/assets
  domain/
    Asset.ts
    types/
      ImageAsset.ts
      TokenAsset.ts
      EffectAsset.ts
      InfoPinAsset.ts
  application/
    AssetManager.ts
    AssetCatalogService.ts
    AssetImportService.ts
  infrastructure/
    repositories/
      FileSystemAssetRepository.ts
  ui/
    AssetLibraryPanel.tsx
    AssetInspector.tsx
```

### 3.4 Session Manager Module
- **Session Controller**: coordinates active map, participants, and subsystem lifecycles. Implements `ISessionController` with methods like `startEncounter(mapId)`, `advanceTurn()`, `applyEffect(effectId, targetId)`.
- **Encounter/Initiative**: `Encounter` aggregates `Combatant` value objects, managed by `InitiativeTracker` (supports sorting, delays, rounds). Emits `TurnChanged` events.
- **Fog of War**: `FogService` computes visibility grids. Uses strategy pattern for algorithms (`SquareLOS`, `HexLOS`, `RaycastLOS`). Updates render layer through events.
- **Movement & Measurement**: `MeasurementTool` reuses the tool framework with session-specific implementations. Movement operations mutate map runtime state via `IMapRuntime` interface.
- **Health & Status**: `ConditionService` manages HP, timers, concentration. Subscribes to initiative events to tick round-based timers and to clock service for realtime timers.
- **Chat & Rolls**: `ChatService` persists message log, `DiceService` provides randomization with deterministic seeds for logging.
- **Event Hub Integration**: all subsystems publish domain events (e.g., `TokenMoved`, `ConditionExpired`) enabling future plugins (sound, notifications) without modifying core code.

```
/session
  application/
    SessionController.ts
    EncounterService.ts
    FogService.ts
    MeasurementTool.ts
    ConditionService.ts
    ChatService.ts
  domain/
    Encounter.ts
    Combatant.ts
    effects/
      Condition.ts
  ui/
    SessionScreen.tsx
    InitiativePanel.tsx
    FogControls.tsx
    ChatPanel.tsx
```

## 4. Shared Kernel & Cross-Cutting Concerns
- **Event Bus**: lightweight pub/sub (`subscribe(event, handler)`, `publish(event, payload)`). Implemented in `shared/eventing`. Modules depend on the interface only; concrete implementation can be swapped for a more robust signal library later.
- **Persistence Services**: `IStorageProvider` abstracts storage (local filesystem, IndexedDB, cloud). Adapters live under `shared/persistence`.
- **Configuration & Logging**: `ConfigService` reads environment-specific settings. `Logger` offers structured logging. Both exposed via interfaces to avoid coupling to specific libraries.
- **Rendering Helpers**: `GridRenderer`, `OverlayRenderer` in `shared/rendering` used by both Map Builder and Session to ensure consistent visuals.
- **Validation & Utilities**: `shared/utils` hosts math helpers (grid coordinate conversion), ID generators, and guard clauses.

```
/shared
  eventing/
    EventBus.ts
    EventTypes.ts
  persistence/
    MapPersistence.ts
    SessionPersistence.ts
  rendering/
    GridRenderer.ts
    FogRenderer.ts
  utils/
    math.ts
    id.ts
```

## 5. Data & Domain Contracts
- **Map Model**
  - `MapMetadata`: id, name, author, creation dates.
  - `MapLayout`: grid definition, measurements (square/hex, scale), environmental settings.
  - `LayerState`: ordered collection of `LayerItem`s (asset placements, drawings, annotations).
  - `LayerItem`: references an `assetId`, transform (position, rotation, scale), layer-specific attributes.
  - `VisibilityMask`: stored per-session to capture fog state independent of the base map.
- **Asset Model**
  - `IAsset` core fields: `id`, `kind`, `displayName`, `tags`, `payload` (type-specific data), optional `components` array.
  - Components examples: `Animatable`, `Annotatable`, `StatBlock`, `Attachment(parentAssetId)`.
- **Session Model**
  - `Encounter`: list of `Combatant` (link to `assetId` + stats), `round`, `activeCombatantId`.
  - `Condition`: `id`, `type`, `duration` (rounds or real-time), `concentrationHolder` (optional).
  - `SessionState`: active map reference, fog mask, chat history, measurement overlays.

## 6. Communication Patterns
- Favor **event-driven interactions** between feature modules. Define events in `shared/eventing/EventTypes.ts`. Examples:
  - `MapEvents.MapSaved(mapId)`
  - `MapEvents.AssetPlaced({ mapId, layerId, assetId, position })`
  - `SessionEvents.TokenMoved({ assetId, from, to })`
  - `SessionEvents.TurnAdvanced({ encounterId, combatantId })`
  - `AssetEvents.AssetImported({ assetId })`
- UI components subscribe via scoped listeners; business logic modules subscribe during initialization and unregister on teardown to avoid leaks.
- For direct service calls (e.g., Session needs to move a token), depend on shared interfaces like `IMapRuntime`.

## 7. Dependency Management & Composition Root
- Maintain a `AppContainer` (manual DI) that instantiates concrete services and injects interfaces into modules.
- Example bootstrapping flow:
  1. `AppContainer` builds shared services (`EventBus`, `StorageProvider`).
  2. Constructs `AssetManager` with repository + event bus.
  3. Provides `MapBuilderModule` and `SessionModule` factory functions configured with dependencies.
  4. `ShellLayout` resolves modules based on navigation (lazy loading supported).
- Testing harnesses can substitute mock implementations (`InMemoryAssetRepository`, `TestEventBus`) by injecting different modules through the container.

## 8. Folder Structure Summary
```
src/
  auth/
  map-builder/
  assets/
  session/
  shared/
  app/
    AppContainer.ts
    routes.tsx
```
- Keep module internals private by exporting only module entry points (`index.ts`). Consumers import `from 'map-builder'` to receive the public API surface.

## 9. Extensibility Playbook
- **Adding a new editor tool**: implement `ITool`, register with `ToolRegistry`. No changes required in existing tools or editor core.
- **Introducing a new asset type**: create class implementing `IAsset` (and optional components), register with `AssetCatalog`. AssetManager auto-indexes via repository metadata.
- **New session subsystem**: implement service, subscribe to relevant events, expose UI if needed. Register in `SessionController` via configuration to initialize with dependencies.
- **Switching storage backend**: implement `IStorageProvider` & `IAssetRepository` variants, update composition root bindings.
- **Supporting hex grids**: add `HexGridStrategy` implementing shared grid interfaces; map builder and session renderers depend on `IGridStrategy`.

## 10. Testing Strategy
- Unit tests per module using dependency injection to substitute fakes/mocks.
- Integration tests for critical workflows (save map, run encounter) bootstrapping modules with in-memory repositories.
- Snapshot/visual tests for UI components housed within each module's `ui` folder.
- Contract tests to ensure modules honor shared interfaces (`IAssetManager`, `IMapRuntime`).

## 11. Roadmap Considerations
- Plan for multiplayer by wrapping session events with an optional networking adapter (e.g., WebSocket sync) without altering core session logic.
- Consider plugin manifest for third-party module extension: modules declare capabilities, container loads them conditionally.
- Document event contracts and public interfaces in `/docs/api` to maintain clarity as the codebase grows.

## 12. Summary
This modular monolith structure balances solo-developer velocity with long-term maintainability. Clear boundaries, shared contracts, and event-driven collaboration allow you to expand features (animated effects, richer combat automation, collaborative play) without untangling a big ball of mud. Keep module APIs stable, use composition for optional behavior, and centralize dependency wiring to stay nimble as requirements evolve.
