import React from "react";
import { normalizeLayers } from "../utils/normalizeLayers.js";

const DROP_INDICATOR_CLASS =
  "absolute top-[-4px] bottom-[-4px] w-1 bg-blue-400 pointer-events-none";

export function useLayerBarState({
  layers = [],
  currentLayer,
  layerVisibility,
  renameLayer,
  removeLayer,
  addLayer,
  reorderLayer,
}) {
  const [renamingId, setRenamingId] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragTarget, setDragTarget] = React.useState(null);

  const layerEntries = React.useMemo(
    () => normalizeLayers(layers),
    [layers],
  );

  const activeLayer = React.useMemo(
    () => layerEntries.find((layer) => layer.id === currentLayer),
    [layerEntries, currentLayer],
  );

  const finishRename = React.useCallback(
    (commit) => {
      if (renamingId) {
        if (commit) renameLayer?.(renamingId, draftName);
        setRenamingId(null);
        setDraftName("");
      }
    },
    [draftName, renamingId, renameLayer],
  );

  const activeLayerVisible = layerVisibility?.[currentLayer] !== false;
  const toggleLabel = activeLayerVisible ? "Hide Layer" : "Show Layer";
  const canRemoveActiveLayer = layerEntries.length > 1 && !!currentLayer;

  const handleRemoveActiveLayer = React.useCallback(() => {
    if (!canRemoveActiveLayer) return;
    finishRename(false);
    removeLayer?.(currentLayer);
  }, [canRemoveActiveLayer, currentLayer, finishRename, removeLayer]);

  const handleAddLayer = React.useCallback(() => {
    finishRename(false);
    addLayer?.();
  }, [addLayer, finishRename]);

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null);
    setDragTarget(null);
  }, []);

  const handleDragStart = React.useCallback((event, layerId) => {
    if (!layerId) return;
    setDraggingId(layerId);
    setDragTarget(null);
    event.dataTransfer?.setData?.("text/plain", layerId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }, []);

  const handleDragOverItem = React.useCallback(
    (event, layerId) => {
      if (!draggingId || draggingId === layerId) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const position =
        event.clientX - rect.left > rect.width / 2 ? "after" : "before";
      setDragTarget((prev) => {
        if (prev && prev.id === layerId && prev.position === position) {
          return prev;
        }
        return { id: layerId, position };
      });
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    },
    [draggingId],
  );

  const handleDragOverEnd = React.useCallback(
    (event) => {
      if (!draggingId) return;
      event.preventDefault();
      setDragTarget((prev) => {
        if (prev && prev.id === null) {
          return prev;
        }
        return { id: null, position: "after" };
      });
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    },
    [draggingId],
  );

  const handleDrop = React.useCallback(
    (event, fallbackId = null) => {
      if (!draggingId) return;
      event.preventDefault();
      const sourceIndex = layerEntries.findIndex(
        (layer) => layer.id === draggingId,
      );
      if (sourceIndex < 0) {
        handleDragEnd();
        return;
      }

      let targetId = dragTarget?.id;
      let position = dragTarget?.position;

      if (!targetId && fallbackId) {
        targetId = fallbackId;
      }

      if (targetId && !position) {
        const rect = event.currentTarget.getBoundingClientRect();
        position =
          event.clientX - rect.left > rect.width / 2 ? "after" : "before";
      }

      let targetIndex;
      if (targetId == null) {
        targetIndex = layerEntries.length;
      } else {
        const overIndex = layerEntries.findIndex(
          (layer) => layer.id === targetId,
        );
        if (overIndex < 0) {
          handleDragEnd();
          return;
        }
        targetIndex = overIndex + (position === "after" ? 1 : 0);
      }

      if (sourceIndex < targetIndex) {
        targetIndex -= 1;
      }

      targetIndex = Math.max(
        0,
        Math.min(layerEntries.length - 1, targetIndex),
      );

      if (targetIndex !== sourceIndex) {
        reorderLayer?.(draggingId, targetIndex);
      }

      handleDragEnd();
    },
    [dragTarget, draggingId, handleDragEnd, layerEntries, reorderLayer],
  );

  return {
    layerEntries,
    activeLayer,
    activeLayerVisible,
    toggleLabel,
    canRemoveActiveLayer,
    renamingId,
    setRenamingId,
    draftName,
    setDraftName,
    draggingId,
    dragTarget,
    dropIndicatorClass: DROP_INDICATOR_CLASS,
    finishRename,
    handleAddLayer,
    handleRemoveActiveLayer,
    handleDragStart,
    handleDragOverItem,
    handleDragOverEnd,
    handleDrop,
    handleDragEnd,
  };
}
