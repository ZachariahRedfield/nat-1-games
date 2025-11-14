import { useCallback } from "react";
import { deepCopyGrid, deepCopyObjects } from "../../utils.js";

const copyLayerList = (layers = []) => layers.map((layer) => ({ ...layer }));

const copyMapState = (maps = {}) => {
  const next = {};
  Object.entries(maps || {}).forEach(([key, grid]) => {
    next[key] = deepCopyGrid(grid);
  });
  return next;
};

const copyObjectState = (objects = {}) => {
  const next = {};
  Object.entries(objects || {}).forEach(([key, list]) => {
    next[key] = deepCopyObjects(list);
  });
  return next;
};

const captureCanvasSnapshots = (layerIds = [], canvasRefs = {}) => {
  if (!layerIds?.length) return undefined;
  const snapshots = {};
  layerIds.forEach((layerId) => {
    const canvas = canvasRefs[layerId]?.current;
    if (!canvas) return;
    try {
      snapshots[layerId] = canvas.toDataURL();
    } catch (error) {
      // Ignore snapshot failures (e.g., tainted canvas)
    }
  });
  return Object.keys(snapshots).length ? snapshots : undefined;
};

const restoreCanvasSnapshots = (snapshots, canvasRefs = {}) => {
  if (!snapshots || !Object.keys(snapshots).length) return;
  const scheduler =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (fn) => setTimeout(fn, 0);
  scheduler(() => {
    Object.entries(snapshots).forEach(([layerId, snapshot]) => {
      const canvas = canvasRefs[layerId]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = snapshot;
    });
  });
};

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

  const onBeginTileStroke = useCallback(
    (layer) => {
      setUndoStack((prev) => [
        ...prev,
        { type: "tilemap", layer, map: deepCopyGrid(maps[layer]) },
      ]);
      setRedoStack([]);
    },
    [maps],
  );

  const onBeginCanvasStroke = useCallback(
    (layer) => {
      const canvas = canvasRefs[layer]?.current;
      if (!canvas) return;
      const snapshot = canvas.toDataURL();
      setUndoStack((prev) => [...prev, { type: "canvas", layer, snapshot }]);
      setRedoStack([]);
    },
    [canvasRefs],
  );

  const onBeginObjectStroke = useCallback(
    (layer) => {
      setUndoStack((prev) => [
        ...prev,
        { type: "objects", layer, objects: deepCopyObjects(objects[layer]) },
      ]);
      setRedoStack([]);
    },
    [objects],
  );

  const onBeginTokenStroke = useCallback(() => {
    setUndoStack((prev) => [
      ...prev,
      { type: "tokens", tokens: deepCopyObjects(tokens) },
    ]);
    setRedoStack([]);
  }, [tokens]);

  const deleteCurrentSelection = useCallback(() => {
    const hasObjects = (selectedObjsList?.length || 0) > 0;
    const hasTokens = (selectedTokensList?.length || 0) > 0;
    if (!hasObjects && !hasTokens) return;

    if (hasTokens) {
      onBeginTokenStroke();
      for (const token of selectedTokensList) {
        removeTokenById?.(token.id);
      }
      clearTokenSelection();
      showToast?.("Deleted selected token(s).", "success");
      return;
    }

    if (hasObjects) {
      onBeginObjectStroke(currentLayer);
      for (const obj of selectedObjsList) {
        removeObjectById(currentLayer, obj.id);
      }
      clearObjectSelection();
      showToast?.("Deleted selected object(s).", "success");
    }
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

    if (entry.type === "tilemap") {
      setRedoStack((prev) => [
        ...prev,
        {
          type: "tilemap",
          layer: entry.layer,
          map: deepCopyGrid(maps[entry.layer]),
        },
      ]);
      setMaps((prev) => ({ ...prev, [entry.layer]: entry.map }));
    } else if (entry.type === "canvas") {
      const canvas = canvasRefs[entry.layer]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const currentSnapshot = canvas.toDataURL();
      setRedoStack((prev) => [
        ...prev,
        { type: "canvas", layer: entry.layer, snapshot: currentSnapshot },
      ]);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = entry.snapshot;
    } else if (entry.type === "objects") {
      setRedoStack((prev) => [
        ...prev,
        {
          type: "objects",
          layer: entry.layer,
          objects: deepCopyObjects(objects[entry.layer]),
        },
      ]);
      setObjects((prev) => ({ ...prev, [entry.layer]: entry.objects }));
    } else if (entry.type === "tokens") {
      setRedoStack((prev) => [
        ...prev,
        { type: "tokens", tokens: deepCopyObjects(tokens) },
      ]);
      setTokens(entry.tokens || []);
    } else if (entry.type === "layers") {
      const canvasLayerIds = entry.canvasSnapshots
        ? Object.keys(entry.canvasSnapshots)
        : [];
      const redoCanvasSnapshots = entry.canvasSnapshots
        ? captureCanvasSnapshots(canvasLayerIds, canvasRefs)
        : undefined;
      setRedoStack((prev) => [
        ...prev,
        {
          type: "layers",
          layers: copyLayerList(layers),
          currentLayer,
          layerVisibility: { ...(layerVisibility || {}) },
          maps: entry.maps ? copyMapState(maps) : undefined,
          objects: entry.objects ? copyObjectState(objects) : undefined,
          canvasSnapshots: redoCanvasSnapshots,
        },
      ]);
      setLayers(copyLayerList(entry.layers || []));
      setCurrentLayer(entry.currentLayer ?? null);
      if (entry.layerVisibility) {
        setLayerVisibility({ ...entry.layerVisibility });
      }
      if (entry.maps) {
        setMaps(copyMapState(entry.maps));
      }
      if (entry.objects) {
        setObjects(copyObjectState(entry.objects));
      }
      if (entry.canvasSnapshots) {
        restoreCanvasSnapshots(entry.canvasSnapshots, canvasRefs);
      }
    } else if (entry.type === "settings") {
      setRedoStack((prev) => [
        ...prev,
        {
          type: "settings",
          settings: {
            gridSettings: { ...gridSettings },
            brushSize,
            canvasOpacity,
            canvasSpacing,
            canvasBlendMode,
            canvasSmoothing,
            naturalSettings: { ...naturalSettings },
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
      if (entry.settings.canvasBlendMode) {
        setCanvasBlendMode(entry.settings.canvasBlendMode);
      }
      if (typeof entry.settings.canvasSmoothing === "number") {
        setCanvasSmoothing(entry.settings.canvasSmoothing);
      }
      if (entry.settings.naturalSettings) {
        setNaturalSettings(entry.settings.naturalSettings);
      }
    } else if (entry.type === "view") {
      const container = scrollRef.current;
      setUndoStack((prev) => [
        ...prev,
        {
          type: "view",
          tileSize,
          scrollLeft: container ? container.scrollLeft : 0,
          scrollTop: container ? container.scrollTop : 0,
        },
      ]);
      setTileSize(entry.tileSize);
      requestAnimationFrame(() => {
        const c = scrollRef.current;
        if (!c) return;
        c.scrollTo({ left: entry.scrollLeft || 0, top: entry.scrollTop || 0 });
      });
    } else if (entry.type === "bundle") {
      setRedoStack((prev) => [
        ...prev,
        {
          type: "bundle",
          layer: entry.layer,
          assets: assets.map((asset) => ({ ...asset })),
          objects: deepCopyObjects(objects[entry.layer] || []),
        },
      ]);
      if (entry.assets) setAssets(entry.assets.map((asset) => ({ ...asset })));
      if (entry.objects) {
        setObjects((prev) => ({ ...prev, [entry.layer]: deepCopyObjects(entry.objects) }));
      }
    }
  }, [
    assets,
    brushSize,
    canvasBlendMode,
    canvasOpacity,
    canvasRefs,
    canvasSpacing,
    canvasSmoothing,
    layerVisibility,
    layers,
    gridSettings,
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
    setGridSettings,
    setMaps,
    setNaturalSettings,
    setObjects,
    setLayers,
    setCurrentLayer,
    setLayerVisibility,
    setTileSize,
    setTokens,
    tileSize,
    tokens,
    undoStack,
  ]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    if (entry.type === "tilemap") {
      setUndoStack((prev) => [
        ...prev,
        {
          type: "tilemap",
          layer: entry.layer,
          map: deepCopyGrid(maps[entry.layer]),
        },
      ]);
      setMaps((prev) => ({ ...prev, [entry.layer]: entry.map }));
    } else if (entry.type === "canvas") {
      const canvas = canvasRefs[entry.layer]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const currentSnapshot = canvas.toDataURL();
      setUndoStack((prev) => [
        ...prev,
        { type: "canvas", layer: entry.layer, snapshot: currentSnapshot },
      ]);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = entry.snapshot;
    } else if (entry.type === "objects") {
      setUndoStack((prev) => [
        ...prev,
        {
          type: "objects",
          layer: entry.layer,
          objects: deepCopyObjects(objects[entry.layer]),
        },
      ]);
      setObjects((prev) => ({ ...prev, [entry.layer]: entry.objects }));
    } else if (entry.type === "tokens") {
      setUndoStack((prev) => [
        ...prev,
        { type: "tokens", tokens: deepCopyObjects(tokens) },
      ]);
      setTokens(entry.tokens || []);
    } else if (entry.type === "layers") {
      const canvasLayerIds = entry.canvasSnapshots
        ? Object.keys(entry.canvasSnapshots)
        : [];
      const undoCanvasSnapshots = entry.canvasSnapshots
        ? captureCanvasSnapshots(canvasLayerIds, canvasRefs)
        : undefined;
      setUndoStack((prev) => [
        ...prev,
        {
          type: "layers",
          layers: copyLayerList(layers),
          currentLayer,
          layerVisibility: { ...(layerVisibility || {}) },
          maps: entry.maps ? copyMapState(maps) : undefined,
          objects: entry.objects ? copyObjectState(objects) : undefined,
          canvasSnapshots: undoCanvasSnapshots,
        },
      ]);
      setLayers(copyLayerList(entry.layers || []));
      setCurrentLayer(entry.currentLayer ?? null);
      if (entry.layerVisibility) {
        setLayerVisibility({ ...entry.layerVisibility });
      }
      if (entry.maps) {
        setMaps(copyMapState(entry.maps));
      }
      if (entry.objects) {
        setObjects(copyObjectState(entry.objects));
      }
      if (entry.canvasSnapshots) {
        restoreCanvasSnapshots(entry.canvasSnapshots, canvasRefs);
      }
    } else if (entry.type === "settings") {
      setUndoStack((prev) => [
        ...prev,
        {
          type: "settings",
          settings: {
            gridSettings: { ...gridSettings },
            brushSize,
            canvasOpacity,
            canvasSpacing,
            canvasBlendMode,
            canvasSmoothing,
            naturalSettings: { ...naturalSettings },
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
      if (entry.settings.canvasBlendMode) {
        setCanvasBlendMode(entry.settings.canvasBlendMode);
      }
      if (typeof entry.settings.canvasSmoothing === "number") {
        setCanvasSmoothing(entry.settings.canvasSmoothing);
      }
      if (entry.settings.naturalSettings) {
        setNaturalSettings(entry.settings.naturalSettings);
      }
    } else if (entry.type === "view") {
      const container = scrollRef.current;
      setUndoStack((prev) => [
        ...prev,
        {
          type: "view",
          tileSize,
          scrollLeft: container ? container.scrollLeft : 0,
          scrollTop: container ? container.scrollTop : 0,
        },
      ]);
      setTileSize(entry.tileSize);
      requestAnimationFrame(() => {
        const c = scrollRef.current;
        if (!c) return;
        c.scrollTo({ left: entry.scrollLeft || 0, top: entry.scrollTop || 0 });
      });
    } else if (entry.type === "bundle") {
      setUndoStack((prev) => [
        ...prev,
        {
          type: "bundle",
          layer: entry.layer,
          assets: assets.map((asset) => ({ ...asset })),
          objects: deepCopyObjects(objects[entry.layer] || []),
        },
      ]);
      if (entry.assets) setAssets(entry.assets.map((asset) => ({ ...asset })));
      if (entry.objects) {
        setObjects((prev) => ({ ...prev, [entry.layer]: deepCopyObjects(entry.objects) }));
      }
    }
  }, [
    assets,
    brushSize,
    canvasBlendMode,
    canvasOpacity,
    canvasRefs,
    canvasSpacing,
    canvasSmoothing,
    layerVisibility,
    layers,
    gridSettings,
    maps,
    naturalSettings,
    objects,
    redoStack,
    scrollRef,
    setAssets,
    setBrushSize,
    setCanvasBlendMode,
    setCanvasOpacity,
    setCanvasSpacing,
    setCanvasSmoothing,
    setGridSettings,
    setMaps,
    setNaturalSettings,
    setObjects,
    setLayers,
    setCurrentLayer,
    setLayerVisibility,
    setTileSize,
    setTokens,
    tileSize,
    tokens,
  ]);

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
