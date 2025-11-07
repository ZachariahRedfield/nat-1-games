import { useCallback, useState } from "react";

const INITIAL_VISIBILITY = {
  background: true,
  base: true,
  sky: true,
};

export function useLayerVisibilityState() {
  const [layerVisibility, setLayerVisibility] = useState(INITIAL_VISIBILITY);

  const toggleLayerVisibility = useCallback((layer) => {
    setLayerVisibility((visibility) => ({
      ...visibility,
      [layer]: !visibility[layer],
    }));
  }, []);

  const showAllLayers = useCallback(() => {
    setLayerVisibility(INITIAL_VISIBILITY);
  }, []);

  const hideAllLayers = useCallback(() => {
    setLayerVisibility({
      background: false,
      base: false,
      sky: false,
    });
  }, []);

  return {
    layerVisibility,
    toggleLayerVisibility,
    showAllLayers,
    hideAllLayers,
  };
}
