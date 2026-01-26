import { useCallback, useEffect, useState } from "react";

const createInitialVisibility = (layers = [], extraKeys = []) => {
  const vis = {};
  layers.forEach((layer) => {
    vis[layer.id] = true;
  });
  extraKeys.forEach((key) => {
    vis[key] = true;
  });
  return vis;
};

export function useLayerVisibilityState(layers = [], extraKeys = []) {
  const [layerVisibility, setLayerVisibility] = useState(() =>
    createInitialVisibility(layers, extraKeys)
  );

  useEffect(() => {
    setLayerVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const layer of layers) {
        if (next[layer.id] === undefined) {
          next[layer.id] = true;
          changed = true;
        }
      }
      for (const key of extraKeys) {
        if (next[key] === undefined) {
          next[key] = true;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!layers.some((layer) => layer.id === key) && !extraKeys.includes(key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [extraKeys, layers]);

  const toggleLayerVisibility = useCallback((layerId) => {
    if (!layerId) return;
    setLayerVisibility((visibility) => {
      const current = visibility?.[layerId] !== false;
      return {
        ...visibility,
        [layerId]: !current,
      };
    });
  }, []);

  const showAllLayers = useCallback(() => {
    setLayerVisibility(createInitialVisibility(layers, extraKeys));
  }, [extraKeys, layers]);

  const hideAllLayers = useCallback(() => {
    const next = {};
    layers.forEach((layer) => {
      next[layer.id] = false;
    });
    extraKeys.forEach((key) => {
      next[key] = false;
    });
    setLayerVisibility(next);
  }, [extraKeys, layers]);

  return {
    layerVisibility,
    setLayerVisibility,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
  };
}
