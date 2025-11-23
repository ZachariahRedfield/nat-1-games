import {
  copyLayerList,
  copyMapState,
  copyObjectState,
  cloneObjectList,
} from "./historyStateCloners.js";
import { restoreCanvasSnapshots } from "./historySnapshots.js";

export function drawCanvasSnapshot(canvas, snapshot) {
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

export function applyLayerEntry(entry, context) {
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

export function applySettingsEntry(entry, context) {
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
  if (typeof settings.canvasOpacity !== "undefined") setCanvasOpacity?.(settings.canvasOpacity);
  if (typeof settings.canvasSpacing !== "undefined") setCanvasSpacing?.(settings.canvasSpacing);
  if (typeof settings.canvasBlendMode !== "undefined") setCanvasBlendMode?.(settings.canvasBlendMode);
  if (typeof settings.canvasSmoothing !== "undefined") setCanvasSmoothing?.(settings.canvasSmoothing);
  if (settings.naturalSettings) setNaturalSettings?.(settings.naturalSettings);
}

export function applyViewEntry(entry, context) {
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

export function applyBundleEntry(entry, context) {
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
