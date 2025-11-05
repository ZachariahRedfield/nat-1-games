import { create } from "zustand";

const LAYERS = ["background", "base", "sky"];
const HISTORY_LIMIT = 50;

const createGrid = (rows, cols, fill = null) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

const cloneGrid = (grid) => grid.map((row) => [...row]);

const cloneMaps = (maps) => ({
  background: cloneGrid(maps.background || []),
  base: cloneGrid(maps.base || []),
  sky: cloneGrid(maps.sky || []),
});

const createInitialMaps = (rows, cols, fill) => ({
  background: createGrid(rows, cols, fill),
  base: createGrid(rows, cols, fill),
  sky: createGrid(rows, cols, fill),
});

const sanitizeLayer = (layer) => (LAYERS.includes(layer) ? layer : "background");

export const createMapStore = ({ rows = 10, cols = 10, fill = null } = {}) => {
  const baseMaps = createInitialMaps(rows, cols, fill);
  return create((set) => ({
    maps: baseMaps,
    activeLayer: "background",
    history: [],
    future: [],

    setActiveLayer: (layer) => set({ activeLayer: sanitizeLayer(layer) }),

    setMaps: (maps) => set({ maps: cloneMaps(maps) }),

    commit: () =>
      set((state) => ({
        history: [...state.history.slice(-(HISTORY_LIMIT - 1)), cloneMaps(state.maps)],
        future: [],
      })),

    undo: () =>
      set((state) => {
        if (!state.history.length) return state;
        const history = state.history.slice();
        const previous = history.pop();
        return {
          history,
          maps: previous,
          future: [cloneMaps(state.maps), ...state.future].slice(0, HISTORY_LIMIT - 1),
        };
      }),

    redo: () =>
      set((state) => {
        if (!state.future.length) return state;
        const [next, ...rest] = state.future;
        return {
          history: [...state.history.slice(-(HISTORY_LIMIT - 1)), cloneMaps(state.maps)],
          maps: next,
          future: rest,
        };
      }),

    applyTile: (layer, row, col, value) =>
      set((state) => {
        const key = sanitizeLayer(layer);
        const grid = state.maps[key];
        if (!grid || !grid.length) return state;
        if (row < 0 || col < 0 || row >= grid.length || col >= grid[0].length) {
          return state;
        }
        const nextGrid = grid.map((r, ri) =>
          ri === row ? r.map((cell, ci) => (ci === col ? value : cell)) : [...r],
        );
        return { maps: { ...state.maps, [key]: nextGrid } };
      }),

    reset: () =>
      set({
        maps: createInitialMaps(rows, cols, fill),
        activeLayer: "background",
        history: [],
        future: [],
      }),
  }));
};

export const useMapStore = createMapStore();
