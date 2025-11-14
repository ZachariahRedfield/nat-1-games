import { useCallback } from "react";

const toLayerIds = (layers) =>
  (layers || [])
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);

export function useSceneGridResizer({ rows, cols, layers, setMaps, setObjects }) {
  return useCallback(() => {
    const resizeLayer = (grid = []) =>
      Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => grid[ri]?.[ci] ?? null)
      );

    const layerIds = toLayerIds(layers);

    setMaps((prev) => {
      const next = {};
      for (const id of layerIds) {
        next[id] = resizeLayer(prev[id]);
      }
      return next;
    });

    setObjects((prev) => {
      const clip = (arr = []) =>
        arr.filter(
          (o) => o.row >= 0 && o.col >= 0 && o.row < rows && o.col < cols
        );

      const next = {};
      for (const id of layerIds) {
        next[id] = clip(prev[id]);
      }
      return next;
    });
  }, [rows, cols, layers, setMaps, setObjects]);
}

export default useSceneGridResizer;
