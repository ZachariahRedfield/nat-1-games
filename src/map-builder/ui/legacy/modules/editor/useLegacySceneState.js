import { useCallback, useMemo, useState } from "react";
import { makeGrid, uid } from "../../utils.js";

const defaultGetCurrentLayer = () => "base";
const defaultGetIsErasing = () => false;
const defaultGetCanvasColor = () => null;

const clampDimension = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.max(1, Math.min(200, base));
};

const buildLayerMaps = (rows, cols) => ({
  background: makeGrid(rows, cols),
  base: makeGrid(rows, cols),
  sky: makeGrid(rows, cols),
});

const buildEmptyObjects = () => ({
  background: [],
  base: [],
  sky: [],
});

export function useLegacySceneState({
  getCurrentLayer,
  getIsErasing,
  getCanvasColor,
  initialRows = 30,
  initialCols = 30,
} = {}) {
  const [rowsInput, setRowsInput] = useState(String(initialRows));
  const [colsInput, setColsInput] = useState(String(initialCols));

  const rows = useMemo(
    () => clampDimension(rowsInput, initialRows),
    [rowsInput, initialRows]
  );
  const cols = useMemo(
    () => clampDimension(colsInput, initialCols),
    [colsInput, initialCols]
  );

  const [maps, setMaps] = useState(() => buildLayerMaps(rows, cols));
  const [objects, setObjects] = useState(() => buildEmptyObjects());

  const updateGridSizes = useCallback(() => {
    const resizeLayer = (grid) =>
      Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => grid[ri]?.[ci] ?? null)
      );

    setMaps((prev) => ({
      background: resizeLayer(prev.background),
      base: resizeLayer(prev.base),
      sky: resizeLayer(prev.sky),
    }));

    setObjects((prev) => {
      const clip = (arr = []) =>
        arr.filter(
          (o) => o.row >= 0 && o.col >= 0 && o.row < rows && o.col < cols
        );

      return {
        background: clip(prev.background),
        base: clip(prev.base),
        sky: clip(prev.sky),
      };
    });
  }, [rows, cols]);

  const placeTiles = useCallback(
    (updates, explicitColor) => {
      if (!Array.isArray(updates) || updates.length === 0) return;
      const layerResolver = getCurrentLayer ?? defaultGetCurrentLayer;
      const erasingResolver = getIsErasing ?? defaultGetIsErasing;
      const colorResolver = getCanvasColor ?? defaultGetCanvasColor;

      const targetLayer = layerResolver();
      if (!targetLayer) return;

      const nextColor = explicitColor ?? colorResolver();
      const isErasing = erasingResolver();

      setMaps((prev) => {
        const src = prev[targetLayer];
        if (!src) return prev;

        let changed = false;
        const nextLayer = src.map((row, ri) =>
          row.map((tile, ci) => {
            const hit = updates.some(
              (u) => u.row === ri && u.col === ci
            );
            if (!hit) return tile;
            const newVal = isErasing ? null : nextColor;
            if (newVal !== tile) changed = true;
            return newVal;
          })
        );

        if (!changed) return prev;
        return { ...prev, [targetLayer]: nextLayer };
      });
    },
    [getCurrentLayer, getIsErasing, getCanvasColor]
  );

  const addObject = useCallback((layer, obj) => {
    if (!layer || !obj) return;
    setObjects((prev) => ({
      ...prev,
      [layer]: [
        ...(prev[layer] || []),
        { ...obj, id: obj.id ?? uid() },
      ],
    }));
  }, []);

  const eraseObjectAt = useCallback((layer, row, col) => {
    if (!layer) return;
    setObjects((prev) => {
      const layerObjects = [...(prev[layer] || [])];
      for (let i = layerObjects.length - 1; i >= 0; i -= 1) {
        const o = layerObjects[i];
        const within =
          row >= o.row &&
          row < o.row + o.hTiles &&
          col >= o.col &&
          col < o.col + o.wTiles;
        if (within) {
          layerObjects.splice(i, 1);
          break;
        }
      }
      return { ...prev, [layer]: layerObjects };
    });
  }, []);

  const moveObject = useCallback((layer, id, row, col) => {
    if (!layer || !id) return;
    setObjects((prev) => ({
      ...prev,
      [layer]: (prev[layer] || []).map((o) =>
        o.id === id ? { ...o, row, col } : o
      ),
    }));
  }, []);

  const updateObjectById = useCallback((layer, id, patch) => {
    if (!layer || !id) return;
    setObjects((prev) => ({
      ...prev,
      [layer]: (prev[layer] || []).map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    }));
  }, []);

  const removeObjectById = useCallback((layer, id) => {
    if (!layer || !id) return;
    setObjects((prev) => ({
      ...prev,
      [layer]: (prev[layer] || []).filter((o) => o.id !== id),
    }));
  }, []);

  return {
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    rows,
    cols,
    maps,
    setMaps,
    objects,
    setObjects,
    updateGridSizes,
    placeTiles,
    addObject,
    eraseObjectAt,
    moveObject,
    updateObjectById,
    removeObjectById,
  };
}
