import { useCallback, useState } from "react";
import { buildEmptyObjects } from "./sceneBuilders.js";
import { uid } from "../../../utils.js";

export function useSceneObjectState() {
  const [objects, setObjects] = useState(() => buildEmptyObjects());

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
    objects,
    setObjects,
    addObject,
    eraseObjectAt,
    moveObject,
    updateObjectById,
    removeObjectById,
  };
}

export default useSceneObjectState;
