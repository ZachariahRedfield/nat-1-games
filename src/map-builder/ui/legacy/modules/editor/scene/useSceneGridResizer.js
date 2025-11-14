import { useCallback } from "react";

export function useSceneGridResizer({ rows, cols, setMaps, setObjects }) {
  return useCallback(() => {
    const resizeLayer = (grid = []) =>
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
  }, [rows, cols, setMaps, setObjects]);
}

export default useSceneGridResizer;
