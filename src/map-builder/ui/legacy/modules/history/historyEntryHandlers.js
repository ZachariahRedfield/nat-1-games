import {
  copyLayerList,
  copyMapLayer,
  copyMapState,
  copyObjectLayer,
  copyObjectState,
  cloneMap,
  cloneObjectList,
  cloneTokenList,
} from "./historyStateCloners.js";
import {
  captureCanvasSnapshots,
  restoreCanvasSnapshots,
} from "./historySnapshots.js";

function pushTilemapSnapshot(targetStackSetter, maps, layer) {
  if (!layer) return;
  const snapshot = copyMapLayer(maps, layer);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "tilemap", layer, map: snapshot },
  ]);
}

function pushCanvasSnapshot(targetStackSetter, layer, canvas) {
  if (!layer || !canvas) return;
  try {
    const snapshot = canvas.toDataURL();
    targetStackSetter?.((prev) => [
      ...prev,
      { type: "canvas", layer, snapshot },
    ]);
  } catch (error) {
    // Ignore snapshot failures (e.g., tainted canvas)
  }
}

function drawCanvasSnapshot(canvas, snapshot) {
  if (!canvas || !snapshot) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = snapshot;
}

function pushObjectsSnapshot(targetStackSetter, objects, layer) {
  if (!layer) return;
  const snapshot = copyObjectLayer(objects, layer);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "objects", layer, objects: snapshot },
  ]);
}

function pushTokensSnapshot(targetStackSetter, tokens) {
  const snapshot = cloneTokenList(tokens);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "tokens", tokens: snapshot },
  ]);
}

function pushLayersSnapshot(targetStackSetter, entry, context) {
  const {
    canvasRefs,
    layers,
    currentLayer,
    layerVisibility,
    maps,
    objects,
  } = context;

  const canvasLayerIds = entry.canvasSnapshots
    ? Object.keys(entry.canvasSnapshots)
    : [];
  const canvasSnapshots = entry.canvasSnapshots
    ? captureCanvasSnapshots(canvasLayerIds, canvasRefs)
    : undefined;

  targetStackSetter?.((prev) => [
    ...prev,
    {
      type: "layers",
      layers: copyLayerList(layers),
      currentLayer,
      layerVisibility: { ...(layerVisibility || {}) },
      maps: entry.maps ? copyMapState(maps) : undefined,
      objects: entry.objects ? copyObjectState(objects) : undefined,
      canvasSnapshots,
    },
  ]);
}

function pushSettingsSnapshot(targetStackSetter, context) {
  const {
    gridSettings,
    brushSize,
    canvasOpacity,
    canvasSpacing,
    canvasBlendMode,
    canvasSmoothing,
    naturalSettings,
  } = context;

  targetStackSetter?.((prev) => [
    ...prev,
    {
      type: "settings",
      settings: {
        gridSettings: { ...(gridSettings || {}) },
        brushSize,
        canvasOpacity,
        canvasSpacing,
        canvasBlendMode,
        canvasSmoothing,
        naturalSettings: naturalSettings ? { ...naturalSettings } : undefined,
      },
    },
  ]);
}

function pushBundleSnapshot(targetStackSetter, context, layer) {
  const { assets = [], objects } = context;
  targetStackSetter?.((prev) => [
    ...prev,
    {
      type: "bundle",
      layer,
      assets: assets.map((asset) => ({ ...asset })),
      objects: cloneObjectList(objects?.[layer] || []),
    },
  ]);
}

function applyLayerEntry(entry, context) {
  const {
    canvasRefs,
    setLayers,
    setCurrentLayer,
    setLayerVisibility,
    setMaps,
    setObjects,
  } = context;

  setLayers?.(copyLayerList(entry.layers || []));
  setCurrentLayer?.(entry.currentLayer ?? null);

  if (entry.layerVisibility) {
    setLayerVisibility?.({ ...entry.layerVisibility });
  }

  if (entry.maps) {
    setMaps?.(copyMapState(entry.maps));
  }

  if (entry.objects) {
    setObjects?.(copyObjectState(entry.objects));
  }

  if (entry.canvasSnapshots) {
    restoreCanvasSnapshots(entry.canvasSnapshots, canvasRefs);
  }
}

function applySettingsEntry(entry, context) {
  const {
    setGridSettings,
    setBrushSize,
    setCanvasOpacity,
    setCanvasSpacing,
    setCanvasBlendMode,
    setCanvasSmoothing,
    setNaturalSettings,
  } = context;

  const settings = entry.settings || {};
  if (settings.gridSettings) setGridSettings?.(settings.gridSettings);
  if (typeof settings.brushSize !== "undefined") setBrushSize?.(settings.brushSize);
  if (typeof settings.canvasOpacity !== "undefined")
    setCanvasOpacity?.(settings.canvasOpacity);
  if (typeof settings.canvasSpacing !== "undefined")
    setCanvasSpacing?.(settings.canvasSpacing);
  if (typeof settings.canvasBlendMode !== "undefined")
    setCanvasBlendMode?.(settings.canvasBlendMode);
  if (typeof settings.canvasSmoothing !== "undefined")
    setCanvasSmoothing?.(settings.canvasSmoothing);
  if (settings.naturalSettings) setNaturalSettings?.(settings.naturalSettings);
}

function applyViewEntry(entry, context) {
  const { scrollRef, tileSize, setTileSize, setUndoStack } = context;
  const container = scrollRef?.current;

  setUndoStack?.((prev) => [
    ...prev,
    {
      type: "view",
      tileSize,
      scrollLeft: container ? container.scrollLeft : 0,
      scrollTop: container ? container.scrollTop : 0,
    },
  ]);

  setTileSize?.(entry.tileSize);
  const scheduler =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (fn) => setTimeout(fn, 0);
  scheduler(() => {
    const current = scrollRef?.current;
    if (!current) return;
    current.scrollTo({
      left: entry.scrollLeft || 0,
      top: entry.scrollTop || 0,
    });
  });
}

function applyBundleEntry(entry, context) {
  const { setAssets, setObjects } = context;
  if (entry.assets) {
    setAssets?.(entry.assets.map((asset) => ({ ...asset })));
  }
  if (entry.objects) {
    setObjects?.((prev) => ({
      ...prev,
      [entry.layer]: cloneObjectList(entry.objects),
    }));
  }
}

export function handleUndoEntry(entry, context) {
  switch (entry.type) {
    case "tilemap":
      pushTilemapSnapshot(context.setRedoStack, context.maps, entry.layer);
      context.setMaps?.((prev) => ({
        ...prev,
        [entry.layer]: cloneMap(entry.map),
      }));
      return;
    case "canvas": {
      const canvas = context.canvasRefs?.[entry.layer]?.current;
      if (!canvas) return;
      pushCanvasSnapshot(context.setRedoStack, entry.layer, canvas);
      drawCanvasSnapshot(canvas, entry.snapshot);
      return;
    }
    case "objects":
      pushObjectsSnapshot(context.setRedoStack, context.objects, entry.layer);
      context.setObjects?.((prev) => ({
        ...prev,
        [entry.layer]: cloneObjectList(entry.objects),
      }));
      return;
    case "tokens":
      pushTokensSnapshot(context.setRedoStack, context.tokens);
      context.setTokens?.(cloneTokenList(entry.tokens || []));
      return;
    case "layers":
      pushLayersSnapshot(context.setRedoStack, entry, context);
      applyLayerEntry(entry, context);
      return;
    case "settings":
      pushSettingsSnapshot(context.setRedoStack, context);
      applySettingsEntry(entry, context);
      return;
    case "view":
      applyViewEntry(entry, context);
      return;
    case "bundle":
      pushBundleSnapshot(context.setRedoStack, context, entry.layer);
      applyBundleEntry(entry, context);
      return;
    default:
      return;
  }
}

export function handleRedoEntry(entry, context) {
  switch (entry.type) {
    case "tilemap":
      pushTilemapSnapshot(context.setUndoStack, context.maps, entry.layer);
      context.setMaps?.((prev) => ({
        ...prev,
        [entry.layer]: cloneMap(entry.map),
      }));
      return;
    case "canvas": {
      const canvas = context.canvasRefs?.[entry.layer]?.current;
      if (!canvas) return;
      pushCanvasSnapshot(context.setUndoStack, entry.layer, canvas);
      drawCanvasSnapshot(canvas, entry.snapshot);
      return;
    }
    case "objects":
      pushObjectsSnapshot(context.setUndoStack, context.objects, entry.layer);
      context.setObjects?.((prev) => ({
        ...prev,
        [entry.layer]: cloneObjectList(entry.objects),
      }));
      return;
    case "tokens":
      pushTokensSnapshot(context.setUndoStack, context.tokens);
      context.setTokens?.(cloneTokenList(entry.tokens || []));
      return;
    case "layers":
      pushLayersSnapshot(context.setUndoStack, entry, context);
      applyLayerEntry(entry, context);
      return;
    case "settings":
      pushSettingsSnapshot(context.setUndoStack, context);
      applySettingsEntry(entry, context);
      return;
    case "view":
      applyViewEntry(entry, context);
      return;
    case "bundle":
      pushBundleSnapshot(context.setUndoStack, context, entry.layer);
      applyBundleEntry(entry, context);
      return;
    default:
      return;
  }
}
