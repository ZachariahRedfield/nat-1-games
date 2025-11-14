import { useCallback, useState } from "react";
import { buildLayerMaps } from "./sceneBuilders.js";
import {
  defaultGetCanvasColor,
  defaultGetCurrentLayer,
  defaultGetIsErasing,
} from "./sceneDefaults.js";

export function useSceneMapState({
  rows,
  cols,
  getCurrentLayer,
  getIsErasing,
  getCanvasColor,
} = {}) {
  const [maps, setMaps] = useState(() => buildLayerMaps(rows, cols));

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
            const hit = updates.some((u) => u.row === ri && u.col === ci);
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

  return {
    maps,
    setMaps,
    placeTiles,
  };
}

export default useSceneMapState;
