import { useCallback, useMemo } from "react";
import {
  cloneMap,
  cloneObjectList,
  cloneTokenList,
} from "../../modules/history/historyStateCloners.js";
import {
  handleRedoEntry,
  handleUndoEntry,
} from "../../modules/history/historyEntryHandlers.js";
import { deleteSelection } from "../../modules/history/selectionDeletion.js";

export function useLegacyHistory({
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
  maps,
  setMaps,
  objects,
  setObjects,
  tokens,
  setTokens,
  assets,
  setAssets,
  gridSettings,
  setGridSettings,
  brushSize,
  setBrushSize,
  canvasOpacity,
  setCanvasOpacity,
  canvasSpacing,
  setCanvasSpacing,
  canvasBlendMode,
  setCanvasBlendMode,
  canvasSmoothing,
  setCanvasSmoothing,
  naturalSettings,
  setNaturalSettings,
  tileSize,
  setTileSize,
  scrollRef,
  canvasRefs,
  layers,
  setLayers,
  setCurrentLayer,
  layerVisibility,
  setLayerVisibility,
  currentLayer,
  showToast,
  selectedObjsList,
  selectedTokensList,
  removeObjectById,
  removeTokenById,
  clearObjectSelection,
  clearTokenSelection,
}) {
  const historyContext = useMemo(
    () => ({
      maps,
      setMaps,
      canvasRefs,
      setUndoStack,
      setRedoStack,
      objects,
      setObjects,
      tokens,
      setTokens,
      layers,
      setLayers,
      currentLayer,
      setCurrentLayer,
      layerVisibility,
      setLayerVisibility,
      gridSettings,
      setGridSettings,
      brushSize,
      setBrushSize,
      canvasOpacity,
      setCanvasOpacity,
      canvasSpacing,
      setCanvasSpacing,
      canvasBlendMode,
      setCanvasBlendMode,
      canvasSmoothing,
      setCanvasSmoothing,
      naturalSettings,
      setNaturalSettings,
      scrollRef,
      tileSize,
      setTileSize,
      assets,
      setAssets,
    }),
    [
      assets,
      brushSize,
      canvasBlendMode,
      canvasOpacity,
      canvasRefs,
      canvasSpacing,
      canvasSmoothing,
      currentLayer,
      gridSettings,
      layerVisibility,
      layers,
      maps,
      naturalSettings,
      objects,
      scrollRef,
      setAssets,
      setBrushSize,
      setCanvasBlendMode,
      setCanvasOpacity,
      setCanvasSpacing,
      setCanvasSmoothing,
      setCurrentLayer,
      setGridSettings,
      setLayers,
      setLayerVisibility,
      setMaps,
      setNaturalSettings,
      setObjects,
      setRedoStack,
      setTileSize,
      setTokens,
      setUndoStack,
      tileSize,
      tokens,
    ],
  );

  const onBeginTileStroke = useCallback(
    (layer) => {
      if (!layer) return;
      setUndoStack((prev) => [
        ...prev,
        { type: "tilemap", layer, map: cloneMap(maps?.[layer]) },
      ]);
      setRedoStack([]);
    },
    [maps, setRedoStack, setUndoStack],
  );

  const onBeginCanvasStroke = useCallback(
    (layer) => {
      if (!layer) return;
      const canvas = canvasRefs?.[layer]?.current;
      if (!canvas) return;
      try {
        const snapshot = canvas.toDataURL();
        setUndoStack((prev) => [...prev, { type: "canvas", layer, snapshot }]);
        setRedoStack([]);
      } catch (error) {
        // Ignore snapshot failures (e.g., tainted canvas)
      }
    },
    [canvasRefs, setRedoStack, setUndoStack],
  );

  const onBeginObjectStroke = useCallback(
    (layer) => {
      if (!layer) return;
      setUndoStack((prev) => [
        ...prev,
        { type: "objects", layer, objects: cloneObjectList(objects?.[layer]) },
      ]);
      setRedoStack([]);
    },
    [objects, setRedoStack, setUndoStack],
  );

  const onBeginTokenStroke = useCallback(() => {
    setUndoStack((prev) => [
      ...prev,
      { type: "tokens", tokens: cloneTokenList(tokens) },
    ]);
    setRedoStack([]);
  }, [setRedoStack, setUndoStack, tokens]);

  const deleteCurrentSelection = useCallback(() => {
    deleteSelection({
      onBeginTokenStroke,
      onBeginObjectStroke,
      currentLayer,
      selectedTokensList,
      selectedObjsList,
      removeObjectById,
      removeTokenById,
      clearObjectSelection,
      clearTokenSelection,
      showToast,
    });
  }, [
    clearObjectSelection,
    clearTokenSelection,
    currentLayer,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    selectedObjsList,
    selectedTokensList,
    showToast,
  ]);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    handleUndoEntry(entry, historyContext);
  }, [historyContext, setUndoStack, undoStack]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    handleRedoEntry(entry, historyContext);
  }, [historyContext, redoStack, setRedoStack]);

  return {
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    onBeginTileStroke,
    onBeginCanvasStroke,
    onBeginObjectStroke,
    onBeginTokenStroke,
    deleteCurrentSelection,
    undo,
    redo,
  };
}
