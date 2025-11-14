import { useCallback, useEffect, useState } from "react";

const createInitialVisibility = (layers = []) => {
  const vis = {};
  layers.forEach((layer) => {
    vis[layer.id] = true;
  });
  return vis;
};

export function useLayerVisibilityState(layers = []) {
  const [layerVisibility, setLayerVisibility] = useState(() =>
    createInitialVisibility(layers)
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
      for (const key of Object.keys(next)) {
        if (!layers.some((layer) => layer.id === key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [layers]);

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
    setLayerVisibility(createInitialVisibility(layers));
  }, [layers]);

  const hideAllLayers = useCallback(() => {
    const next = {};
    layers.forEach((layer) => {
      next[layer.id] = false;
    });
    setLayerVisibility(next);
  }, [layers]);

  return {
    layerVisibility,
    setLayerVisibility,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
  };
}
