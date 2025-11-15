import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultLayers,
  ensureLayerName,
  nextLayerName,
  uid,
} from "../../../utils.js";

export function useLayerAndInteractionState() {
  const [layers, setLayers] = useState(() => createDefaultLayers());
  const [currentLayer, setCurrentLayer] = useState(() => createDefaultLayers()[0]?.id ?? null);
  const [interactionMode, setInteractionMode] = useState("draw");
  const [isErasing, setIsErasing] = useState(false);
  const [canvasColor, setCanvasColor] = useState(null);

  useEffect(() => {
    if (!layers.length) {
      setLayers(createDefaultLayers());
      return;
    }
    if (!layers.some((layer) => layer.id === currentLayer)) {
      setCurrentLayer(layers[0]?.id ?? null);
    }
  }, [layers, currentLayer]);

  const layersById = useMemo(() => {
    const map = new Map();
    for (const layer of layers) map.set(layer.id, layer);
    return map;
  }, [layers]);

  const addLayer = useCallback(() => {
    setLayers((prev) => {
      const id = uid();
      const name = nextLayerName(prev);
      const next = [...prev, { id, name }];
      setCurrentLayer(id);
      return next;
    });
  }, []);

  const removeLayer = useCallback((layerId) => {
    if (!layerId) return;
    setLayers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((layer) => layer.id !== layerId);
      if (next.length === prev.length) return prev;
      setCurrentLayer((current) => {
        if (current === layerId) {
          return next[0]?.id ?? null;
        }
        return current;
      });
      return next;
    });
  }, []);

  const renameLayer = useCallback((layerId, name) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, name: ensureLayerName(name, layer.name) }
          : layer
      )
    );
  }, []);

  const moveLayer = useCallback((layerId, targetIndex) => {
    setLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === layerId);
      if (index < 0) return prev;
      const clampedIndex = Math.max(0, Math.min(prev.length - 1, targetIndex ?? 0));
      if (index === clampedIndex) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(clampedIndex, 0, item);
      return next;
    });
  }, []);

  return {
    layers,
    setLayers,
    currentLayer,
    setCurrentLayer,
    layersById,
    addLayer,
    removeLayer,
    renameLayer,
    moveLayer,
    interactionMode,
    setInteractionMode,
    isErasing,
    setIsErasing,
    canvasColor,
    setCanvasColor,
  };
}

export default useLayerAndInteractionState;
