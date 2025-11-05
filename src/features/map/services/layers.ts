import { createStore, type StoreApi } from "../../../core/store";
import { createSelection, ensureSelection } from "../../../core/selection";
import { layerSchema, type LayerDefinition } from "../schema/layer.z";
import { DEFAULT_DIMENSIONS, createGrid, type GridDimensions, type TileGrid } from "./grid";

export interface MapLayer extends LayerDefinition {
  selected?: boolean;
}

export interface MapStoreState {
  dimensions: GridDimensions;
  layers: MapLayer[];
  activeLayerId: string;
  selectedLayerIds: string[];
  addLayer: (layer: Partial<MapLayer>) => void;
  updateLayer: (id: string, updater: (layer: MapLayer) => MapLayer) => void;
  reorderLayers: (ids: string[]) => void;
  setActiveLayer: (id: string) => void;
  setDimensions: (dimensions: GridDimensions) => void;
  toggleLayerSelection: (id: string) => void;
}

const DEFAULT_LAYER_BLUEPRINTS: Array<Pick<MapLayer, "id" | "name" | "type">> = [
  { id: "background", name: "Background", type: "background" },
  { id: "base", name: "Base", type: "base" },
  { id: "overlay", name: "Overlay", type: "overlay" },
];

const createLayerId = () => `layer-${Math.random().toString(36).slice(2)}`;

function normalizeLayer(partial: Partial<MapLayer>, dimensions: GridDimensions): MapLayer {
  const grid: TileGrid =
    partial.grid ?? createGrid(dimensions);
  const parsed = layerSchema.parse({
    id: partial.id ?? createLayerId(),
    name: partial.name ?? "Layer",
    type: partial.type ?? "base",
    visible: partial.visible ?? true,
    opacity: partial.opacity ?? 1,
    grid,
  });
  return { ...parsed, selected: partial.selected ?? false };
}

function createDefaultLayers(dimensions: GridDimensions): MapLayer[] {
  return DEFAULT_LAYER_BLUEPRINTS.map((blueprint) =>
    normalizeLayer({ ...blueprint, grid: createGrid(dimensions) }, dimensions)
  );
}

export type MapStoreApi = StoreApi<MapStoreState>;

export function createMapStore(initialDimensions: GridDimensions = DEFAULT_DIMENSIONS): MapStoreApi {
  const selection = createSelection();
  selection.replace(["base"]);
  return createStore<MapStoreState>((set) => ({
    dimensions: initialDimensions,
    layers: createDefaultLayers(initialDimensions).map((layer) =>
      layer.id === "base" ? { ...layer, selected: true } : layer
    ),
    activeLayerId: "base",
    selectedLayerIds: ["base"],
    addLayer: (layer) =>
      set((state) => {
        const nextLayer = normalizeLayer(layer, state.dimensions);
        return {
          layers: [...state.layers, nextLayer],
          selectedLayerIds: selection.replace([nextLayer.id]).values(),
          activeLayerId: nextLayer.id,
        };
      }),
    updateLayer: (id, updater) =>
      set((state) => ({
        layers: state.layers.map((layer) => (layer.id === id ? updater(layer) : layer)),
      })),
    reorderLayers: (ids) =>
      set((state) => {
        const order = new Map(ids.map((id, index) => [id, index] as const));
        return {
          layers: [...state.layers].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
        };
      }),
    setActiveLayer: (id) =>
      set((state) => ({
        activeLayerId: id,
        selectedLayerIds: selection.replace([id]).values(),
        layers: ensureSelection(state.layers, [id]),
      })),
    setDimensions: (dimensions) =>
      set((state) => ({
        dimensions,
        layers: state.layers.map((layer) => ({
          ...layer,
          grid: createGrid(dimensions),
          selected: layer.selected ?? state.selectedLayerIds.includes(layer.id),
        })),
      })),
    toggleLayerSelection: (id) =>
      set((state) => ({
        selectedLayerIds: selection.toggle(id).values(),
        layers: ensureSelection(state.layers, selection.values()),
      })),
  }));
}
