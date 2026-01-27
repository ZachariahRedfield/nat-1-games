import {
  cloneMap,
  cloneObjectList,
  cloneTokenList,
} from "./historyStateCloners.js";
import {
  applyBundleEntry,
  applyLayerEntry,
  applySettingsEntry,
  applyViewEntry,
  drawCanvasSnapshot,
} from "./historyEntryAppliers.js";
import {
  pushBundleSnapshot,
  pushCanvasSnapshot,
  pushLayersSnapshot,
  pushObjectsSnapshot,
  pushAssetsSnapshot,
  pushSettingsSnapshot,
  pushTilemapSnapshot,
  pushTokensSnapshot,
} from "./historySnapshotPushers.js";

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
    case "assets":
      pushAssetsSnapshot(context.setRedoStack, context.assets);
      context.setAssets?.(entry.assets?.map((asset) => ({ ...asset })) || []);
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
    case "assets":
      pushAssetsSnapshot(context.setUndoStack, context.assets);
      context.setAssets?.(entry.assets?.map((asset) => ({ ...asset })) || []);
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
