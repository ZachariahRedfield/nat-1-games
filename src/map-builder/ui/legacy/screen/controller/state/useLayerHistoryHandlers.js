import { useCallback } from "react";
import { deepCopyGrid, deepCopyObjects } from "../../../utils.js";

export function useLayerHistoryHandlers({
  layerState,
  layerVisibilityState,
  canvasRefs,
  sceneMaps,
  sceneObjects,
  setUndoStack,
  setRedoStack,
}) {
  const {
    layers = [],
    currentLayer,
    addLayer,
    removeLayer,
    renameLayer,
    moveLayer,
  } = layerState;
  const { layerVisibility } = layerVisibilityState;

  const captureLayerHistorySnapshot = useCallback(
    ({ includeMaps = false, includeObjects = false, includeCanvasFor } = {}) => {
      const snapshot = {
        type: "layers",
        layers: layers.map((layer) => ({ ...layer })),
        currentLayer,
        layerVisibility: { ...layerVisibility },
      };

      if (includeMaps) {
        const mapSnapshot = {};
        Object.entries(sceneMaps || {}).forEach(([id, grid]) => {
          mapSnapshot[id] = deepCopyGrid(grid);
        });
        if (Object.keys(mapSnapshot).length) {
          snapshot.maps = mapSnapshot;
        }
      }

      if (includeObjects) {
        const objectSnapshot = {};
        Object.entries(sceneObjects || {}).forEach(([id, list]) => {
          objectSnapshot[id] = deepCopyObjects(list);
        });
        if (Object.keys(objectSnapshot).length) {
          snapshot.objects = objectSnapshot;
        }
      }

      if (includeCanvasFor && includeCanvasFor.length) {
        const canvasSnapshot = {};
        includeCanvasFor.forEach((layerId) => {
          const canvas = canvasRefs?.[layerId]?.current;
          if (!canvas) return;
          try {
            canvasSnapshot[layerId] = canvas.toDataURL();
          } catch (error) {
            // Ignore snapshot failures (e.g., tainted canvas)
          }
        });
        if (Object.keys(canvasSnapshot).length) {
          snapshot.canvasSnapshots = canvasSnapshot;
        }
      }

      return snapshot;
    },
    [canvasRefs, currentLayer, layerVisibility, layers, sceneMaps, sceneObjects],
  );

  const pushLayerHistory = useCallback(
    ({ includeMaps = false, includeObjects = false, includeCanvas = false, targetLayerId, targetLayerIds } = {}) => {
      const layerIds = targetLayerIds
        ? targetLayerIds.filter(Boolean)
        : targetLayerId
        ? [targetLayerId]
        : [];

      const entry = captureLayerHistorySnapshot({
        includeMaps,
        includeObjects,
        includeCanvasFor: includeCanvas ? layerIds : undefined,
      });

      setUndoStack((prev) => [...prev, entry]);
      setRedoStack([]);
    },
    [captureLayerHistorySnapshot, setRedoStack, setUndoStack],
  );

  const addLayerWithHistory = useCallback(() => {
    pushLayerHistory({});
    addLayer();
  }, [addLayer, pushLayerHistory]);

  const removeLayerWithHistory = useCallback(
    (layerId) => {
      if (!layerId) return;
      if ((layers || []).length <= 1) {
        removeLayer(layerId);
        return;
      }
      pushLayerHistory({
        includeMaps: true,
        includeObjects: true,
        includeCanvas: true,
        targetLayerId: layerId,
      });
      removeLayer(layerId);
    },
    [layers, pushLayerHistory, removeLayer],
  );

  const renameLayerWithHistory = useCallback(
    (layerId, name) => {
      if (!layerId) return;
      pushLayerHistory({});
      renameLayer(layerId, name);
    },
    [pushLayerHistory, renameLayer],
  );

  const reorderLayerWithHistory = useCallback(
    (layerId, targetIndex) => {
      if (!layerId) return;
      const currentIndex = layers.findIndex((layer) => layer.id === layerId);
      if (currentIndex < 0) return;
      const clampedTarget = Math.max(0, Math.min(layers.length - 1, targetIndex ?? 0));
      if (currentIndex === clampedTarget) return;
      pushLayerHistory({});
      moveLayer(layerId, clampedTarget);
    },
    [layers, moveLayer, pushLayerHistory],
  );

  return {
    addLayerWithHistory,
    removeLayerWithHistory,
    renameLayerWithHistory,
    reorderLayerWithHistory,
  };
}

export default useLayerHistoryHandlers;
