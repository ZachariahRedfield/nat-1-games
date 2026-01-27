import {
  copyLayerList,
  copyMapLayer,
  copyMapState,
  copyObjectLayer,
  copyObjectState,
  cloneObjectList,
  cloneTokenList,
} from "./historyStateCloners.js";
import { captureCanvasSnapshots } from "./historySnapshots.js";

export function pushTilemapSnapshot(targetStackSetter, maps, layer) {
  if (!layer) return;
  const snapshot = copyMapLayer(maps, layer);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "tilemap", layer, map: snapshot },
  ]);
}

export function pushCanvasSnapshot(targetStackSetter, layer, canvas) {
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

export function pushObjectsSnapshot(targetStackSetter, objects, layer) {
  if (!layer) return;
  const snapshot = copyObjectLayer(objects, layer);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "objects", layer, objects: snapshot },
  ]);
}

export function pushTokensSnapshot(targetStackSetter, tokens) {
  const snapshot = cloneTokenList(tokens);
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "tokens", tokens: snapshot },
  ]);
}

export function pushAssetsSnapshot(targetStackSetter, assets) {
  const snapshot = (assets || []).map((asset) => ({ ...asset }));
  targetStackSetter?.((prev) => [
    ...prev,
    { type: "assets", assets: snapshot },
  ]);
}

export function pushLayersSnapshot(targetStackSetter, entry, context) {
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

export function pushSettingsSnapshot(targetStackSetter, context) {
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

export function pushBundleSnapshot(targetStackSetter, context, layer) {
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
