import { useCallback, useEffect, useState } from "react";
import { makeGrid } from "../../../utils.js";
import { buildLayerMaps } from "./sceneBuilders.js";
import {
  defaultGetCanvasColor,
  defaultGetCurrentLayer,
  defaultGetIsErasing,
} from "./sceneDefaults.js";

const toLayerIds = (layers) =>
  (layers || [])
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);

export function useSceneMapState({
  rows,
  cols,
  layers,
  getCurrentLayer,
  getIsErasing,
  getCanvasColor,
} = {}) {
  const [maps, setMaps] = useState(() => buildLayerMaps(layers, rows, cols));

  useEffect(() => {
    const layerIds = toLayerIds(layers);
    setMaps((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of layerIds) {
        if (!next[id]) {
          next[id] = makeGrid(rows, cols);
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!layerIds.includes(key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [layers, rows, cols]);

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
        const src = prev[targetLayer] || makeGrid(rows, cols);

        let changed = false;
        const nextLayer = src.map((row, ri) =>
          row.map((tile, ci) => {
            const hit = updates.some((u) => u.row === ri && u.col === ci);
            if (!hit) return tile;
            const newVal = isErasing ? null : nextColor;
            if (newVal !== tile) changed = true;
            return newVal;
          })
        );

        if (!changed && prev[targetLayer]) return prev;
        return { ...prev, [targetLayer]: nextLayer };
      });
    },
    [cols, getCanvasColor, getCurrentLayer, getIsErasing, rows]
  );

  return {
    maps,
    setMaps,
    placeTiles,
  };
}

export default useSceneMapState;
